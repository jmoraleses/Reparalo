import { Star } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface ReviewCardProps {
  rating: number;
  comment: string | null;
  createdAt: string;
  customerName?: string;
}

export function ReviewCard({ rating, comment, createdAt, customerName }: ReviewCardProps) {
  return (
    <div className="border-b border-border py-4 last:border-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`h-4 w-4 ${
                  star <= rating
                    ? "fill-warning text-warning"
                    : "text-muted-foreground/30"
                }`}
              />
            ))}
          </div>
          {customerName && (
            <span className="text-sm font-medium text-foreground">
              {customerName}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(createdAt), {
            addSuffix: true,
            locale: es,
          })}
        </span>
      </div>
      {comment && (
        <p className="text-sm text-muted-foreground">{comment}</p>
      )}
    </div>
  );
}
