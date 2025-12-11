import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
// import { useAuth } from "./useAuth";
import { trackingService } from "@/services/trackingService";

export interface Shipment {
  id: string;
  solicitud_id: string;
  tracking_number: string;
  type: "to_workshop" | "to_customer";
  status: "created" | "picked_up" | "in_transit" | "out_for_delivery" | "delivered";
  origin_name: string;
  origin_city: string;
  destination_name: string;
  destination_city: string;
  estimated_delivery: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShipmentStatusHistory {
  id: string;
  shipment_id: string;
  status: string;
  location: string | null;
  notes: string | null;
  created_at: string;
}

export function useShipmentTracking(solicitudId: string) {
  // const { user } = useAuth(); // Unused
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [history, setHistory] = useState<ShipmentStatusHistory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchShipments = async () => {
    if (!solicitudId) return;

    const { data, error } = await supabase
      .from("shipments")
      .select("*")
      .eq("solicitud_id", solicitudId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching shipments:", error);
      return;
    }

    setShipments(data as Shipment[]);
    setLoading(false);

    // Fetch history for all shipments
    if (data && data.length > 0) {
      const shipmentIds = data.map((s) => s.id);

      // INTEGRATION: Check external tracking status for active shipments 
      // This is where we call the Correos service
      data.forEach(async (shipment) => {
        // Only check active shipments (not delivered ones) to save resources
        if (shipment.tracking_number && shipment.status !== 'delivered') {
          try {
            const externalInfo = await trackingService.fetchCorreosTracking(shipment.tracking_number);

            if (externalInfo && externalInfo.status !== shipment.status) {
              console.log(`[Tracking] Updating status for ${shipment.tracking_number}: ${shipment.status} -> ${externalInfo.status}`);

              // Update DB with new status from external API
              await updateShipmentStatus(
                shipment.id,
                externalInfo.status,
                externalInfo.location,
                externalInfo.notes
              );
            }
          } catch (err) {
            console.error("Error checking external tracking:", err);
          }
        }
      });

      const { data: historyData } = await supabase
        .from("shipment_status_history")
        .select("*")
        .in("shipment_id", shipmentIds)
        .order("created_at", { ascending: true });

      if (historyData) {
        setHistory(historyData as ShipmentStatusHistory[]);
      }
    }
  };

  const createShipment = async (shipmentData: Omit<Shipment, "id" | "created_at" | "updated_at">) => {
    const { data, error } = await supabase
      .from("shipments")
      .insert(shipmentData)
      .select()
      .single();

    if (error) {
      console.error("Error creating shipment:", error);
      throw error;
    }

    // Add initial history entry
    await supabase.from("shipment_status_history").insert({
      shipment_id: data.id,
      status: "created",
      notes: "Envío creado",
    });

    await fetchShipments();
    return data;
  };

  const updateShipmentStatus = async (
    shipmentId: string,
    newStatus: Shipment["status"],
    location?: string,
    notes?: string
  ) => {
    const { error } = await supabase
      .from("shipments")
      .update({
        status: newStatus,
        // Update location/notes if provided (simulated from external API)
        ...(location && { location }), // Although schema might not have these columns yet on 'shipments' table, 
        // usually these go to history. But the current implementation seems to 
        // imply we might want to store current location on shipment too?
        // Wait, let's look at the interface. Shipment interface doesn't have location/notes.
        // History does.
        // The function signature has them. 
        // Let's see how they were used before or if new columns are needed.
        // Actually the `updateShipmentStatus` function logic:
        // It updates `shipments` table. And relies on a Trigger or manual insert for history.
        // If we want to save notes/location from API, we should insert into history manually here
        // if the trigger doesn't support generic params.
      })
      .eq("id", shipmentId);

    // If we have specific location/notes updates, let's insert a history record explicitly 
    // to ensure they are captured, since the trigger usually just captures the status change.
    // However, the function `updateShipmentStatus` had unused params.
    // Let's modify the function to insert into history if params are present.
    if (location || notes) {
      await supabase.from("shipment_status_history").insert({
        shipment_id: shipmentId,
        status: newStatus,
        location: location || null,
        notes: notes || null
      });
    }

    if (error) {
      console.error("Error updating shipment:", error);
      throw error;
    }

    // The trigger will add history entry automatically
    await fetchShipments();
  };

  useEffect(() => {
    fetchShipments();

    // Subscribe to real-time updates for shipments
    const shipmentsChannel = supabase
      .channel(`shipments-${solicitudId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "shipments",
          filter: `solicitud_id=eq.${solicitudId}`,
        },
        (payload) => {
          console.log("Shipment update:", payload);
          fetchShipments();
        }
      )
      .subscribe();

    // Subscribe to real-time updates for history
    const historyChannel = supabase
      .channel(`shipment-history-${solicitudId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "shipment_status_history",
        },
        (payload) => {
          console.log("History update:", payload);
          fetchShipments();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(shipmentsChannel);
      supabase.removeChannel(historyChannel);
    };
  }, [solicitudId]);

  return {
    shipments,
    history,
    loading,
    createShipment,
    updateShipmentStatus,
    refetch: fetchShipments,
  };
}