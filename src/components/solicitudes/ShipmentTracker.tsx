import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Truck,
  CheckCircle,
  RefreshCw
} from "lucide-react";
import type { Shipment, ShipmentStatusHistory } from "@/hooks/useShipmentTracking";

interface ShipmentTrackerProps {
  shipment: Shipment;
  history: ShipmentStatusHistory[]; // Kept in interface to avoid breaking parent usage
  canUpdate?: boolean;
  onUpdateStatus?: (newStatus: Shipment["status"]) => void;
}

const statusConfig: Record<Shipment["status"], { label: string; icon: typeof Package; color: string }> = {
  created: { label: "Creado", icon: Package, color: "bg-muted text-muted-foreground" },
  picked_up: { label: "Recogido", icon: Package, color: "bg-blue-500/10 text-blue-500" },
  in_transit: { label: "En tránsito", icon: Truck, color: "bg-amber-500/10 text-amber-500" },
  out_for_delivery: { label: "En reparto", icon: Truck, color: "bg-orange-500/10 text-orange-500" },
  delivered: { label: "Entregado", icon: CheckCircle, color: "bg-green-500/10 text-green-500" },
};

// Simplified 3-step flow for shipments to workshop
const toWorkshopSteps = [
  { status: "created" as const, label: "Cliente" },
  { status: "in_transit" as const, label: "En tránsito" },
  { status: "delivered" as const, label: "Taller" },
];

// Full flow for returns to customer
const toCustomerSteps = [
  { status: "created" as const, label: "Taller" },
  { status: "in_transit" as const, label: "En tránsito" },
  { status: "out_for_delivery" as const, label: "En reparto" },
  { status: "delivered" as const, label: "Cliente" },
];

export function ShipmentTracker({ shipment, canUpdate = false, onUpdateStatus }: ShipmentTrackerProps) {
  const config = statusConfig[shipment.status];
  const StatusIcon = config.icon;

  // Use simplified steps for to_workshop, full steps for to_customer
  const steps = shipment.type === "to_workshop" ? toWorkshopSteps : toCustomerSteps;
  const currentStepIndex = steps.findIndex(step => step.status === shipment.status);
  const currentIndex = currentStepIndex >= 0 ? currentStepIndex : 0;

  const getNextStatus = (): Shipment["status"] | null => {
    const nextIndex = currentIndex + 1;
    if (nextIndex < steps.length) {
      return steps[nextIndex].status;
    }
    return null;
  };

  const nextStatus = getNextStatus();

  return (
    <Card className="p-4 bg-card border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          <h4 className="font-medium text-foreground">
            {shipment.type === "to_workshop" ? "Envío al taller" : "Devolución al cliente"}
          </h4>
        </div>
        <Badge className={config.color}>
          <StatusIcon className="h-3 w-3 mr-1" />
          {config.label}
        </Badge>
      </div>

      {/* Tracking number - simplified */}
      <div className="mb-6 flex items-center gap-2 px-1">
        <span className="text-sm text-muted-foreground">Seguimiento:</span>
        <span className="font-mono font-medium text-foreground">{shipment.tracking_number}</span>
      </div>

      {/* Correos Express Link */}
      <div className="mt-2 text-center">
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => window.open(`https://www.correosexpress.com/`, '_blank')}
        >
          <Truck className="h-4 w-4" />
          Ver seguimiento en Correos Express
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Se abrirá la web oficial de Correos Express
        </p>
      </div>

      {/* Update button for workshops - only for return shipments, not for shipments to workshop (automatic tracking) */}
      {canUpdate && nextStatus && onUpdateStatus && shipment.type === "to_customer" && (
        <div className="mt-4 pt-4 border-t border-border">
          <Button
            onClick={() => onUpdateStatus(nextStatus)}
            size="sm"
            className="w-full"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar a: {steps.find(s => s.status === nextStatus)?.label || statusConfig[nextStatus].label}
          </Button>
        </div>
      )}
    </Card>
  );
}