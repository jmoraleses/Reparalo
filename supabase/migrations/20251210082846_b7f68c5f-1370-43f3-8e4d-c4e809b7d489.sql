-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  solicitud_id UUID NOT NULL REFERENCES public.solicitudes(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  workshop_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint to prevent duplicate reviews
ALTER TABLE public.reviews ADD CONSTRAINT unique_review_per_solicitud UNIQUE (solicitud_id);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Reviews are viewable by everyone"
ON public.reviews
FOR SELECT
USING (true);

CREATE POLICY "Customers can create reviews for their completed repairs"
ON public.reviews
FOR INSERT
WITH CHECK (
  auth.uid() = customer_id
  AND EXISTS (
    SELECT 1 FROM public.solicitudes s
    WHERE s.id = solicitud_id
      AND s.user_id = auth.uid()
      AND s.status = 'completado'
  )
);

-- Function to update workshop rating when a new review is added
CREATE OR REPLACE FUNCTION public.update_workshop_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  avg_rating DECIMAL;
  review_count INTEGER;
BEGIN
  -- Calculate new average rating and count
  SELECT AVG(rating)::DECIMAL, COUNT(*)
  INTO avg_rating, review_count
  FROM public.reviews
  WHERE workshop_id = NEW.workshop_id;

  -- Update the workshop profile
  UPDATE public.profiles
  SET 
    workshop_rating = avg_rating,
    workshop_reviews_count = review_count
  WHERE user_id = NEW.workshop_id;

  RETURN NEW;
END;
$$;

-- Trigger to update rating on new review
CREATE TRIGGER on_new_review
AFTER INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_workshop_rating();

-- Enable realtime for reviews
ALTER PUBLICATION supabase_realtime ADD TABLE public.reviews;