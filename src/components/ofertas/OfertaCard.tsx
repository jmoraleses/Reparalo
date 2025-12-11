import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Clock, CheckCircle, Wrench, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useMessages } from "@/hooks/useMessages";
import { toast } from "sonner";
import { useState } from "react";
import { WorkshopReviews } from "@/components/reviews/WorkshopReviews";
// import { CounterOfferDialog } from "@/components/solicitudes/CounterOfferDialog";
interface Oferta {
  id: string;
  estimated_cost_min: number;
  estimated_cost_max: number;
  diagnosis_cost: number;
  transport_cost: number;
  estimated_days: number;
  message: string | null;
  status: string;
  final_quote?: number | null;
  workshop_id: string;
  workshop: {
    workshop_name: string | null;
    workshop_rating: number | null;
    workshop_reviews_count: number | null;
    workshop_city: string | null;
  } | null;
}

interface OfertaCardProps {
  oferta: Oferta;
  isOwner: boolean;
  solicitudId?: string;
  onAccept?: (ofertaId: string) => void;
  isAccepted?: boolean;
  onEdit?: (oferta: Oferta) => void;
}

export function OfertaCard({ oferta, isOwner, solicitudId, onAccept, isAccepted, onEdit }: OfertaCardProps) {
  const navigate = useNavigate();
  const { getOrCreateConversation } = useMessages();
  const [startingChat, setStartingChat] = useState(false);
  const totalUpfront = oferta.diagnosis_cost + oferta.transport_cost;

  const handleContactWorkshop = async () => {
    if (!oferta.workshop_id) return;

    setStartingChat(true);
    try {
      const conversationId = await getOrCreateConversation(oferta.workshop_id, solicitudId);
      if (conversationId) {
        navigate(`/mensajes?conversation=${conversationId}`);
      } else {
        toast.error("Error al iniciar la conversación");
      }
    } catch (error) {
      console.error("Error starting conversation:", error);
      toast.error("Error al iniciar la conversación");
    } finally {
      setStartingChat(false);
    }
  };

  return (
    <Card className={cn(
      "p-6 bg-card transition-all",
      isAccepted && "ring-2 ring-primary bg-primary/5"
    )}>
      <div className="flex flex-col md:flex-row md:items-start gap-4">
        {/* Workshop info */}
        <div className="flex items-start gap-3 flex-1">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0">
            <Wrench className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-foreground">
                {oferta.workshop?.workshop_name || "Taller"}
              </h4>
              {isAccepted && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  <CheckCircle className="h-3 w-3" />
                  Seleccionada
                </span>
              )}
            </div>
            {oferta.workshop?.workshop_city && (
              <p className="text-sm text-muted-foreground">{oferta.workshop.workshop_city}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              {oferta.workshop?.workshop_rating && oferta.workshop.workshop_rating > 0 ? (
                <WorkshopReviews
                  workshopId={oferta.workshop_id}
                  workshopName={oferta.workshop.workshop_name || "Taller"}
                  rating={oferta.workshop.workshop_rating}
                  reviewsCount={oferta.workshop.workshop_reviews_count}
                  variant="inline"
                />
              ) : (
                <span className="text-sm text-muted-foreground">Sin reseñas aún</span>
              )}
            </div>
          </div>
        </div>

        {/* Price info */}
        <div className="flex flex-col items-end gap-2">
          <div className="text-right">
            <div className="text-2xl font-bold text-foreground">
              {oferta.estimated_cost_min}€ - {oferta.estimated_cost_max}€
            </div>
            <div className="text-sm text-muted-foreground">Presupuesto estimado</div>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{oferta.estimated_days} días</span>
          </div>
        </div>
      </div>

      {/* Cost breakdown */}
      <div className="mt-4 pt-4 border-t border-border">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Diagnóstico:</span>
            <span className="ml-2 font-medium text-foreground">{oferta.diagnosis_cost}€</span>
          </div>
          <div>
            <span className="text-muted-foreground">Transporte:</span>
            <span className="ml-2 font-medium text-foreground">{oferta.transport_cost}€</span>
          </div>
          <div className="col-span-2 md:text-right">
            <span className="text-muted-foreground">Pago inicial:</span>
            <span className="ml-2 font-semibold text-primary">{totalUpfront}€</span>
          </div>
        </div>
      </div>

      {/* Message */}
      {oferta.message && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">{oferta.message}</p>
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 pt-4 border-t border-border flex justify-end gap-2">
        {isOwner && (
          <Button
            variant="outline"
            onClick={handleContactWorkshop}
            disabled={startingChat}
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            {startingChat ? "Abriendo..." : "Contactar taller"}
          </Button>
        )}

        {/* User Actions (Owner) */}
        {isOwner && !isAccepted && oferta.status === "pendiente" && solicitudId && (
          <Button onClick={() => onAccept?.(oferta.id)}>
            Aceptar oferta
          </Button>
        )}

        {/* Workshop Actions (Edit) */}
        {!isOwner && !isAccepted && oferta.status === "pendiente" && (
          <Button
            variant="outline"
            onClick={() => onEdit?.(oferta)}
          >
            Editar presupuesto
          </Button>
        )}
      </div>
    </Card>
  );
}
