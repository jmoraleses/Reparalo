import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Check, X, MessageSquare, Loader2, HandCoins, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface CounterOffer {
  id: string;
  amount: number;
  proposed_by: string;
  status: string;
  message: string | null;
  created_at: string;
}

interface CounterOffersListProps {
  solicitudId: string;
  offerId: string;
  isWorkshop: boolean;
  onStatusChange: () => void;
  currentStatus?: string;
}

export function CounterOffersList({
  solicitudId,
  offerId,
  isWorkshop,
  onStatusChange,
  currentStatus,
}: CounterOffersListProps) {
  const [counterOffers, setCounterOffers] = useState<CounterOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [responding, setResponding] = useState<string | null>(null);
  const [showWorkshopCounterForm, setShowWorkshopCounterForm] = useState<string | null>(null);
  const [workshopAmount, setWorkshopAmount] = useState("");
  const [workshopMessage, setWorkshopMessage] = useState("");

  const fetchCounterOffers = async () => {
    const { data, error } = await supabase
      .from("counter_offers")
      .select("*")
      .eq("solicitud_id", solicitudId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching counter offers:", error);
    } else {
      setCounterOffers(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCounterOffers();

    // Subscribe to changes
    const channel = supabase
      .channel(`counter_offers_${solicitudId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "counter_offers",
          filter: `solicitud_id=eq.${solicitudId}`,
        },
        () => {
          fetchCounterOffers();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [solicitudId]);

  const handleAcceptCounterOffer = async (counterOffer: CounterOffer) => {
    setResponding(counterOffer.id);
    try {
      // Update counter offer status
      const { error: updateError } = await supabase
        .from("counter_offers")
        .update({ status: "accepted" })
        .eq("id", counterOffer.id);

      if (updateError) throw updateError;

      // Update the offer with new final quote and status
      const { error: offerError } = await supabase
        .from("ofertas")
        .update({ final_quote: counterOffer.amount, status: "aceptada" })
        .eq("id", offerId);

      if (offerError) throw offerError;

      // Update solicitud status to oferta_seleccionada (ready to ship)
      const { error: solicitudError } = await supabase
        .from("solicitudes")
        .update({ status: "oferta_seleccionada" })
        .eq("id", solicitudId);

      if (solicitudError) throw solicitudError;

      toast.success("Contraoferta aceptada. El cliente puede enviar el dispositivo.");
      onStatusChange();
    } catch (error: any) {
      console.error("Error accepting counter offer:", error);
      toast.error(error.message || "Error al aceptar la contraoferta");
    } finally {
      setResponding(null);
    }
  };

  const handleWorkshopCounterOffer = async (customerCounterOfferId: string, customerAmount: number) => {
    const numAmount = parseFloat(workshopAmount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Por favor, introduce un importe válido");
      return;
    }

    if (numAmount <= customerAmount) {
      toast.error("Tu contraoferta debe ser mayor a la del cliente");
      return;
    }

    setResponding(customerCounterOfferId);
    try {
      // Reject the customer's counter offer
      const { error: rejectError } = await supabase
        .from("counter_offers")
        .update({ status: "rejected" })
        .eq("id", customerCounterOfferId);

      if (rejectError) throw rejectError;

      // Create workshop's counter offer
      const { error: counterOfferError } = await supabase
        .from("counter_offers")
        .insert({
          solicitud_id: solicitudId,
          offer_id: offerId,
          amount: numAmount,
          proposed_by: "workshop",
          message: workshopMessage || null,
        });

      if (counterOfferError) throw counterOfferError;

      // Get current count and increment
      const { data: solicitud } = await supabase
        .from("solicitudes")
        .select("counter_offer_count")
        .eq("id", solicitudId)
        .maybeSingle();

      const newCount = (solicitud?.counter_offer_count || 0) + 1;

      // Keep status as negociando
      const { error: solicitudError } = await supabase
        .from("solicitudes")
        .update({ counter_offer_count: newCount })
        .eq("id", solicitudId);

      if (solicitudError) throw solicitudError;

      toast.success("Contraoferta enviada al cliente");
      setShowWorkshopCounterForm(null);
      setWorkshopAmount("");
      setWorkshopMessage("");
      onStatusChange();
    } catch (error: any) {
      console.error("Error creating workshop counter offer:", error);
      toast.error(error.message || "Error al enviar la contraoferta");
    } finally {
      setResponding(null);
    }
  };

  const handleRejectCounterOffer = async (counterOffer: CounterOffer) => {
    setResponding(counterOffer.id);
    try {
      // Update counter offer status
      const { error: updateError } = await supabase
        .from("counter_offers")
        .update({ status: "rejected" })
        .eq("id", counterOffer.id);

      if (updateError) throw updateError;

      // Get current counter offer count
      const { data: solicitud } = await supabase
        .from("solicitudes")
        .select("counter_offer_count")
        .eq("id", solicitudId)
        .maybeSingle();

      const count = solicitud?.counter_offer_count || 0;

      if (count >= 3) {
        // Max counter offers reached, cancel the repair
        const { error: cancelError } = await supabase
          .from("solicitudes")
          .update({ status: "cancelado" })
          .eq("id", solicitudId);

        if (cancelError) throw cancelError;

        toast.info("Negociación finalizada. La solicitud ha sido cancelada.");
      } else {
        // Keep status as negociando, customer can try again
        toast.info("Contraoferta rechazada. El cliente puede hacer otra propuesta.");
      }

      onStatusChange();
    } catch (error: any) {
      console.error("Error rejecting counter offer:", error);
      toast.error(error.message || "Error al rechazar la contraoferta");
    } finally {
      setResponding(null);
    }
  };

  // Customer accepts workshop counter offer
  const handleCustomerAcceptCounterOffer = async (counterOffer: CounterOffer) => {
    setResponding(counterOffer.id);
    try {
      // Update counter offer status
      const { error: updateError } = await supabase
        .from("counter_offers")
        .update({ status: "accepted" })
        .eq("id", counterOffer.id);

      if (updateError) throw updateError;

      // Update the offer with new final quote and status
      const { error: offerError } = await supabase
        .from("ofertas")
        .update({ final_quote: counterOffer.amount, status: "aceptada" })
        .eq("id", offerId);

      if (offerError) throw offerError;

      // Update solicitud status to oferta_seleccionada
      const { error: solicitudError } = await supabase
        .from("solicitudes")
        .update({ status: "oferta_seleccionada" })
        .eq("id", solicitudId);

      if (solicitudError) throw solicitudError;

      toast.success("¡Precio acordado! Ahora puedes enviar tu dispositivo.");
      onStatusChange();
    } catch (error: any) {
      console.error("Error accepting workshop counter offer:", error);
      toast.error(error.message || "Error al aceptar la contraoferta");
    } finally {
      setResponding(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (counterOffers.length === 0) {
    return null;
  }

  // Check if any counter offer has been accepted or if the solicitud has moved past negotiation
  const isNegotiationClosed = currentStatus && !['negociando', 'presupuesto_final'].includes(currentStatus);
  const hasAcceptedOffer = counterOffers.some(co => co.status === "accepted") || isNegotiationClosed;
  const acceptedCounterOffer = counterOffers.find(co => co.status === "accepted");

  return (
    <div className="space-y-3">
      {/* Show accepted price banner */}
      {hasAcceptedOffer && (
        <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/30 rounded-lg">
          <CheckCircle2 className="h-6 w-6 text-success shrink-0" />
          <div>
            <p className="font-semibold text-foreground">
              ¡Precio acordado: {acceptedCounterOffer?.amount || counterOffers[0]?.amount}€
            </p>
            <p className="text-sm text-muted-foreground">
              Ambas partes han llegado a un acuerdo
            </p>
          </div>
        </div>
      )}

      <h4 className="text-sm font-medium text-foreground flex items-center gap-2">
        <MessageSquare className="h-4 w-4" />
        Historial de negociación
      </h4>
      
      {counterOffers.map((co) => (
        <Card key={co.id} className="p-3 bg-card">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-foreground">{co.amount}€</span>
                <Badge variant={co.proposed_by === "customer" ? "secondary" : "outline"}>
                  {co.proposed_by === "customer" ? "Cliente" : "Taller"}
                </Badge>
                {co.status === "pending" && (
                  <Badge variant="outline" className="text-warning border-warning">
                    Pendiente
                  </Badge>
                )}
                {co.status === "accepted" && (
                  <Badge variant="outline" className="text-success border-success">
                    Aceptada
                  </Badge>
                )}
                {co.status === "rejected" && (
                  <Badge variant="outline" className="text-destructive border-destructive">
                    Rechazada
                  </Badge>
                )}
              </div>
              {co.message && (
                <p className="text-sm text-muted-foreground mt-1">{co.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(co.created_at), "d MMM yyyy, HH:mm", { locale: es })}
              </p>
            </div>

            {/* Workshop can respond to pending customer counter offers */}
            {isWorkshop && co.status === "pending" && co.proposed_by === "customer" && !hasAcceptedOffer && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowWorkshopCounterForm(co.id)}
                  disabled={responding === co.id}
                  title="Contraoferta"
                >
                  <HandCoins className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRejectCounterOffer(co)}
                  disabled={responding === co.id}
                  className="text-destructive hover:text-destructive"
                  title="Rechazar"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleAcceptCounterOffer(co)}
                  disabled={responding === co.id}
                  title="Aceptar"
                >
                  {responding === co.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}

            {/* Customer can respond to pending workshop counter offers */}
            {!isWorkshop && co.status === "pending" && co.proposed_by === "workshop" && !hasAcceptedOffer && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRejectCounterOffer(co)}
                  disabled={responding === co.id}
                  className="text-destructive hover:text-destructive"
                  title="Rechazar"
                >
                  <X className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleCustomerAcceptCounterOffer(co)}
                  disabled={responding === co.id}
                  title="Aceptar"
                >
                  {responding === co.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </Button>
              </div>
            )}
          </div>

          {/* Workshop counter offer form */}
          {showWorkshopCounterForm === co.id && (
            <div className="mt-3 pt-3 border-t border-border space-y-3">
              <div className="space-y-2">
                <Label htmlFor={`amount-${co.id}`}>Tu contraoferta (€)</Label>
                <Input
                  id={`amount-${co.id}`}
                  type="number"
                  placeholder={`Mayor a ${co.amount}€`}
                  value={workshopAmount}
                  onChange={(e) => setWorkshopAmount(e.target.value)}
                  min={co.amount + 1}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`message-${co.id}`}>Justificación</Label>
                <Textarea
                  id={`message-${co.id}`}
                  placeholder="Explica por qué este precio..."
                  value={workshopMessage}
                  onChange={(e) => setWorkshopMessage(e.target.value)}
                  rows={2}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setShowWorkshopCounterForm(null);
                    setWorkshopAmount("");
                    setWorkshopMessage("");
                  }}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleWorkshopCounterOffer(co.id, co.amount)}
                  disabled={responding === co.id || !workshopAmount}
                >
                  {responding === co.id ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <HandCoins className="h-4 w-4 mr-1" />
                  )}
                  Enviar
                </Button>
              </div>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}
