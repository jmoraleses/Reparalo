import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";
import {
  Search,
  FileText,
  CircleDot,
  Send,
  Loader2,
  Euro
} from "lucide-react";

type RepairStatus = Database["public"]["Enums"]["repair_status"];

interface WorkshopStatusControlsProps {
  solicitudId: string;
  currentStatus: string;
  selectedOfferId: string;
  onStatusChange: () => void;
  customerId: string;
}

const statusTransitions: Record<string, { next: RepairStatus; label: string; icon: React.ComponentType<{ className?: string }> }> = {
  en_camino_taller: { next: "diagnostico", label: "Dispositivo recibido - Iniciar diagnóstico", icon: Search },
  diagnostico: { next: "presupuesto_final", label: "Enviar presupuesto final", icon: FileText },
  // presupuesto_final -> en_reparacion is handled by CustomerStatusControls (customer accepts quote)
  en_reparacion: { next: "reparado", label: "Marcar como reparado", icon: CircleDot },
  reparado: { next: "en_camino_cliente", label: "Enviar al cliente", icon: Send },
};

export function WorkshopStatusControls({
  solicitudId,
  currentStatus,
  selectedOfferId,
  onStatusChange,
  customerId,
}: WorkshopStatusControlsProps) {
  const [loading, setLoading] = useState(false);
  const [finalQuote, setFinalQuote] = useState("");
  const [showQuoteInput, setShowQuoteInput] = useState(false);

  const transition = statusTransitions[currentStatus];

  if (!transition) {
    return null;
  }

  const handleStatusChange = async () => {
    // If going to presupuesto_final, show quote input first
    if (currentStatus === "diagnostico" && !showQuoteInput) {
      setShowQuoteInput(true);
      return;
    }

    // Validate final quote when required
    if (currentStatus === "diagnostico") {
      const quote = parseFloat(finalQuote);
      if (isNaN(quote) || quote <= 0) {
        toast.error("Por favor, introduce un presupuesto válido");
        return;
      }
    }

    setLoading(true);

    try {
      // Update the status
      const { error: statusError } = await supabase
        .from("solicitudes")
        .update({ status: transition.next })
        .eq("id", solicitudId);

      if (statusError) throw statusError;

      // If setting final quote, update the offer
      if (currentStatus === "diagnostico" && finalQuote) {
        const { error: quoteError } = await supabase
          .from("ofertas")
          .update({ final_quote: parseFloat(finalQuote) })
          .eq("id", selectedOfferId);

        if (quoteError) throw quoteError;
      }

      // Notification to customer
      let notificationTitle = "Actualización de estado";
      let notificationMessage = `Tu solicitud ha cambiado de estado a: ${transition.label}`;

      switch (transition.next) {
        case "diagnostico":
          title: "Dispositivo recibido";
          message: "El taller ha recibido tu dispositivo y comenzará el diagnóstico.";
          break;
        case "presupuesto_final":
          title: "Presupuesto final listo";
          message: `El taller ha enviado el presupuesto final: ${finalQuote}€. Revísalo para continuar.`;
          break;
        case "reparado":
          title: "¡Reparación completada!";
          message: "Tu dispositivo ha sido reparado correctamente.";
          break;
        case "en_camino_cliente":
          title: "Dispositivo enviado";
          message: "Tu dispositivo reparado está en camino de vuelta.";
          break;
      }

      await supabase.from("notifications").insert({
        user_id: customerId,
        type: "status_change",
        title: notificationTitle,
        message: notificationMessage,
        link: `/solicitud/${solicitudId}`,
        read: false,
      });

      toast.success("Estado actualizado correctamente");
      setShowQuoteInput(false);
      setFinalQuote("");
      onStatusChange();
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error(error.message || "Error al actualizar el estado");
    } finally {
      setLoading(false);
    }
  };

  const Icon = transition.icon;

  return (
    <Card className="p-4 bg-primary/5 border-primary/20">
      <h3 className="font-semibold text-foreground mb-3 text-sm">
        Acciones del taller
      </h3>

      {showQuoteInput ? (
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="finalQuote">Presupuesto final (€)</Label>
            <div className="relative">
              <Euro className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="finalQuote"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={finalQuote}
                onChange={(e) => setFinalQuote(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowQuoteInput(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleStatusChange}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Enviar presupuesto
                </>
              )}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={handleStatusChange}
          disabled={loading}
          className="w-full"
          size="sm"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Icon className="h-4 w-4 mr-2" />
              {transition.label}
            </>
          )}
        </Button>
      )}
    </Card>
  );
}
