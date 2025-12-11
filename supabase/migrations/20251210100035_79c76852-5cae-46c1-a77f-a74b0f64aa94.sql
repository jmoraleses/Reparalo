-- Create counter_offers table to track negotiation history
CREATE TABLE public.counter_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  solicitud_id UUID NOT NULL REFERENCES public.solicitudes(id) ON DELETE CASCADE,
  offer_id UUID NOT NULL REFERENCES public.ofertas(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  proposed_by TEXT NOT NULL CHECK (proposed_by IN ('customer', 'workshop')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.counter_offers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view counter_offers for their solicitudes"
ON public.counter_offers
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.solicitudes s
    WHERE s.id = counter_offers.solicitud_id
    AND (s.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.ofertas o
      WHERE o.id = s.selected_offer_id AND o.workshop_id = auth.uid()
    ))
  )
);

CREATE POLICY "Customers can create counter_offers for their solicitudes"
ON public.counter_offers
FOR INSERT
WITH CHECK (
  proposed_by = 'customer' AND
  EXISTS (
    SELECT 1 FROM public.solicitudes s
    WHERE s.id = counter_offers.solicitud_id AND s.user_id = auth.uid()
  )
);

CREATE POLICY "Workshops can create counter_offers for their repairs"
ON public.counter_offers
FOR INSERT
WITH CHECK (
  proposed_by = 'workshop' AND
  EXISTS (
    SELECT 1 FROM public.solicitudes s
    JOIN public.ofertas o ON o.id = s.selected_offer_id
    WHERE s.id = counter_offers.solicitud_id AND o.workshop_id = auth.uid()
  )
);

CREATE POLICY "Workshops can update counter_offers status"
ON public.counter_offers
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.solicitudes s
    JOIN public.ofertas o ON o.id = s.selected_offer_id
    WHERE s.id = counter_offers.solicitud_id AND o.workshop_id = auth.uid()
  )
);

-- Add counter_offer_count to solicitudes to track number of counter offers
ALTER TABLE public.solicitudes ADD COLUMN counter_offer_count INTEGER DEFAULT 0;

-- Add status for negotiation
-- We'll use 'negociando' as a new status when counter-offers are being made
-- Note: We need to add this to the repair_status enum
ALTER TYPE public.repair_status ADD VALUE IF NOT EXISTS 'negociando' AFTER 'presupuesto_final';