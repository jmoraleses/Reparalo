import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Star, Loader2, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReviewFormProps {
  solicitudId: string;
  workshopId: string;
  workshopName: string;
  onReviewSubmitted: () => void;
}

export function ReviewForm({
  solicitudId,
  workshopId,
  workshopName,
  onReviewSubmitted,
}: ReviewFormProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!user || rating === 0) {
      toast.error("Por favor selecciona una valoración");
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from("reviews").insert({
        solicitud_id: solicitudId,
        customer_id: user.id,
        workshop_id: workshopId,
        rating,
        comment: comment.trim() || null,
      });

      if (error) throw error;

      toast.success("¡Gracias por tu valoración!");
      onReviewSubmitted();
    } catch (error: any) {
      console.error("Error submitting review:", error);
      if (error.code === "23505") {
        toast.error("Ya has valorado esta reparación");
      } else {
        toast.error("Error al enviar la valoración");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="p-6 bg-card border-primary/20">
      <h3 className="font-semibold text-foreground mb-2">
        Valora tu experiencia con {workshopName}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        Tu opinión ayuda a otros usuarios a elegir el mejor taller
      </p>

      {/* Star rating */}
      <div className="flex items-center gap-1 mb-4">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            className="p-1 transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                "h-8 w-8 transition-colors",
                (hoveredRating || rating) >= star
                  ? "fill-warning text-warning"
                  : "text-muted-foreground/30"
              )}
            />
          </button>
        ))}
        <span className="ml-2 text-sm text-muted-foreground">
          {rating > 0 && (
            <>
              {rating === 1 && "Muy malo"}
              {rating === 2 && "Malo"}
              {rating === 3 && "Normal"}
              {rating === 4 && "Bueno"}
              {rating === 5 && "Excelente"}
            </>
          )}
        </span>
      </div>

      {/* Comment */}
      <Textarea
        placeholder="Cuéntanos tu experiencia (opcional)..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        className="mb-4"
        maxLength={500}
      />

      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {comment.length}/500 caracteres
        </span>
        <Button onClick={handleSubmit} disabled={rating === 0 || submitting}>
          {submitting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Send className="h-4 w-4 mr-2" />
          )}
          Enviar valoración
        </Button>
      </div>
    </Card>
  );
}
