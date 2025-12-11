import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import { Package, Printer, MapPin, Calendar, Hash } from "lucide-react";

interface ShippingLabelProps {
  trackingNumber: string;
  origin: {
    name: string;
    city: string;
  };
  destination: {
    name: string;
    city: string;
  };
  deviceInfo: string;
  createdAt: string;
  type: "to_workshop" | "to_customer";
}

export function ShippingLabel({ 
  trackingNumber, 
  origin, 
  destination, 
  deviceInfo,
  createdAt,
  type 
}: ShippingLabelProps) {
  const handlePrint = () => {
    window.print();
  };

  const labelTitle = type === "to_workshop" 
    ? "Etiqueta de envío al taller" 
    : "Etiqueta de devolución al cliente";

  return (
    <Card className="p-6 bg-card border-2 border-dashed border-primary/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          {labelTitle}
        </h3>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Imprimir
        </Button>
      </div>

      <div className="bg-background rounded-lg p-4 border border-border">
        {/* Header with tracking */}
        <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Nº de seguimiento</p>
            <p className="font-mono text-lg font-bold text-foreground flex items-center gap-1">
              <Hash className="h-4 w-4" />
              {trackingNumber}
            </p>
          </div>
          <QRCodeSVG 
            value={trackingNumber} 
            size={64} 
            className="rounded"
          />
        </div>

        {/* Origin and Destination */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Remitente</p>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium text-foreground text-sm">{origin.name}</p>
                <p className="text-sm text-muted-foreground">{origin.city}</p>
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Destinatario</p>
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 text-primary mt-0.5" />
              <div>
                <p className="font-medium text-foreground text-sm">{destination.name}</p>
                <p className="text-sm text-muted-foreground">{destination.city}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Device and Date */}
        <div className="flex items-center justify-between text-sm border-t border-border pt-3">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Package className="h-4 w-4" />
            <span>{deviceInfo}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{createdAt}</span>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground mt-3 text-center">
        Adjunta esta etiqueta al paquete antes de enviarlo
      </p>
    </Card>
  );
}