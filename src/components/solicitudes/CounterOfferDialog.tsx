import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MessageSquare, Loader2, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CounterOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  solicitudId: string;
  offerId: string;
  currentQuote: number;
  counterOfferCount: number;
  onSuccess: () => void;
  isInitialOffer?: boolean;
}

const MAX_COUNTER_OFFERS = 3;

export function CounterOfferDialog({
  open,
  onOpenChange,
  solicitudId,
  offerId,
  currentQuote,
  counterOfferCount,
  onSuccess,
  isInitialOffer = false,
}: CounterOfferDialogProps) {
  const [amount, setAmount] = useState<string>("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const remainingOffers = MAX_COUNTER_OFFERS - counterOfferCount;

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error("Por favor, introduce un importe válido");
      return;
    }

    if (numAmount >= currentQuote) {
      toast.error("La contraoferta debe ser menor al presupuesto actual");
      return;
    }

    setLoading(true);
    try {
      // Create counter offer
      const { error: counterOfferError } = await supabase
        .from("counter_offers")
        .insert({
          solicitud_id: solicitudId,
          offer_id: offerId,
          amount: numAmount,
          proposed_by: "customer",
          message: message || null,
        });

      if (counterOfferError) throw counterOfferError;

      // Update counter offer count and status
      // For initial offers, we need to select the offer and set to negociando
      if (isInitialOffer) {
        const { error: solicitudError } = await supabase
          .from("solicitudes")
          .update({ 
            counter_offer_count: counterOfferCount + 1,
            status: "negociando",
            selected_offer_id: offerId
          })
          .eq("id", solicitudId);

        if (solicitudError) throw solicitudError;
      } else {
        const { error: solicitudError } = await supabase
          .from("solicitudes")
          .update({ 
            counter_offer_count: counterOfferCount + 1,
            status: "negociando"
          })
          .eq("id", solicitudId);

        if (solicitudError) throw solicitudError;
      }

      toast.success("Contraoferta enviada al taller");
      setAmount("");
      setMessage("");
      onOpenChange(false);
      onSuccess();
    } catch (error: any) {
      console.error("Error creating counter offer:", error);
      toast.error(error.message || "Error al enviar la contraoferta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Enviar contraoferta
          </DialogTitle>
          <DialogDescription>
            Propón un precio alternativo al taller. Te quedan {remainingOffers} {remainingOffers === 1 ? "intento" : "intentos"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm text-muted-foreground">
              {isInitialOffer ? "Presupuesto estimado promedio:" : "Presupuesto actual del taller:"}
            </span>
            <span className="font-bold text-foreground">{currentQuote}€</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Tu contraoferta (€)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Ej: 120"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              min={1}
              max={currentQuote - 1}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensaje (opcional)</Label>
            <Textarea
              id="message"
              placeholder="Explica por qué propones este precio..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
            />
          </div>

          {remainingOffers === 1 && (
            <div className="flex items-start gap-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground">Último intento</p>
                <p className="text-muted-foreground">
                  Si el taller no acepta esta contraoferta, el dispositivo será devuelto sin reparar.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !amount}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar contraoferta"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
