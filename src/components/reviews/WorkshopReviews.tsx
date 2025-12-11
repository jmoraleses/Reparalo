import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ReviewCard } from "./ReviewCard";
import { Star, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
  customer_name?: string;
}

interface WorkshopReviewsProps {
  workshopId: string;
  workshopName?: string;
  rating?: number | null;
  reviewsCount?: number | null;
  variant?: "inline" | "button";
}

export function WorkshopReviews({
  workshopId,
  workshopName,
  rating,
  reviewsCount,
  variant = "button",
}: WorkshopReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reviews")
        .select("id, rating, comment, created_at, customer_id")
        .eq("workshop_id", workshopId)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      // Get customer names
      const reviewsWithNames = await Promise.all(
        (data || []).map(async (review) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("user_id", review.customer_id)
            .maybeSingle();

          return {
            ...review,
            customer_name: profile?.full_name || "Cliente",
          };
        })
      );

      setReviews(reviewsWithNames);
    } catch (error) {
      console.error("Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      fetchReviews();
    }
  }, [open, workshopId]);

  if (!reviewsCount || reviewsCount === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {variant === "button" ? (
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:text-foreground">
            <Star className="h-4 w-4 fill-warning text-warning" />
            <span className="font-medium text-foreground">{rating?.toFixed(1)}</span>
            <span>({reviewsCount} reseñas)</span>
          </Button>
        ) : (
          <button className="flex items-center gap-2 hover:underline cursor-pointer">
            <Star className="h-4 w-4 fill-warning text-warning" />
            <span className="text-sm font-medium text-foreground">
              {rating?.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">
              ({reviewsCount} reseñas)
            </span>
          </button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Reseñas de {workshopName || "Taller"}
          </DialogTitle>
        </DialogHeader>

        {/* Rating summary */}
        <div className="flex items-center gap-3 py-4 border-b border-border">
          <div className="text-4xl font-bold text-foreground">{rating?.toFixed(1)}</div>
          <div>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`h-5 w-5 ${
                    star <= Math.round(rating || 0)
                      ? "fill-warning text-warning"
                      : "text-muted-foreground/30"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Basado en {reviewsCount} {reviewsCount === 1 ? "reseña" : "reseñas"}
            </p>
          </div>
        </div>

        {/* Reviews list */}
        <ScrollArea className="max-h-[400px]">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : reviews.length > 0 ? (
            <div className="space-y-1">
              {reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  rating={review.rating}
                  comment={review.comment}
                  createdAt={review.created_at}
                  customerName={review.customer_name}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No hay reseñas disponibles
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
