
-- Allow workshops to update solicitudes they have accepted offers for
CREATE POLICY "Workshops can update solicitudes they're working on"
ON public.solicitudes
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.ofertas 
    WHERE ofertas.id = solicitudes.selected_offer_id 
    AND ofertas.workshop_id = auth.uid()
  )
);
