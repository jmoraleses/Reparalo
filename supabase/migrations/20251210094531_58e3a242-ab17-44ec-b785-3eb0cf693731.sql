-- Create shipments table for tracking
CREATE TABLE public.shipments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  solicitud_id UUID NOT NULL REFERENCES public.solicitudes(id) ON DELETE CASCADE,
  tracking_number TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('to_workshop', 'to_customer')),
  status TEXT NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered')),
  origin_name TEXT NOT NULL,
  origin_city TEXT NOT NULL,
  destination_name TEXT NOT NULL,
  destination_city TEXT NOT NULL,
  estimated_delivery DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shipment status history table
CREATE TABLE public.shipment_status_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  location TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipment_status_history ENABLE ROW LEVEL SECURITY;

-- RLS policies for shipments
CREATE POLICY "Users can view shipments for their solicitudes"
ON public.shipments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.solicitudes s
    WHERE s.id = shipments.solicitud_id
    AND (s.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.ofertas o
      WHERE o.id = s.selected_offer_id AND o.workshop_id = auth.uid()
    ))
  )
);

CREATE POLICY "System can create shipments"
ON public.shipments FOR INSERT
WITH CHECK (true);

CREATE POLICY "Workshops can update shipments they manage"
ON public.shipments FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.solicitudes s
    JOIN public.ofertas o ON o.id = s.selected_offer_id
    WHERE s.id = shipments.solicitud_id AND o.workshop_id = auth.uid()
  )
);

-- RLS policies for shipment status history
CREATE POLICY "Users can view shipment history for their shipments"
ON public.shipment_status_history FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.shipments sh
    JOIN public.solicitudes s ON s.id = sh.solicitud_id
    WHERE sh.id = shipment_status_history.shipment_id
    AND (s.user_id = auth.uid() OR EXISTS (
      SELECT 1 FROM public.ofertas o
      WHERE o.id = s.selected_offer_id AND o.workshop_id = auth.uid()
    ))
  )
);

CREATE POLICY "System can create shipment history"
ON public.shipment_status_history FOR INSERT
WITH CHECK (true);

-- Enable realtime for shipments
ALTER PUBLICATION supabase_realtime ADD TABLE public.shipments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.shipment_status_history;

-- Trigger to update shipments.updated_at
CREATE TRIGGER update_shipments_updated_at
BEFORE UPDATE ON public.shipments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger to add history entry when shipment status changes
CREATE OR REPLACE FUNCTION public.log_shipment_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.shipment_status_history (shipment_id, status, notes)
    VALUES (NEW.id, NEW.status, 'Estado actualizado a ' || NEW.status);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER log_shipment_status
AFTER UPDATE ON public.shipments
FOR EACH ROW
EXECUTE FUNCTION public.log_shipment_status_change();