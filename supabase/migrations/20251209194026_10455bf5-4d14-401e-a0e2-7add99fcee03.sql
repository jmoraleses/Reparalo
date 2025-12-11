-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'new_offer', 'offer_accepted', 'status_change', 'message'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT, -- URL to navigate to when clicked
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
CREATE POLICY "Users can view their own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update (mark as read) their own notifications
CREATE POLICY "Users can update their own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete their own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- System can insert notifications (via triggers/functions)
CREATE POLICY "System can insert notifications"
ON public.notifications
FOR INSERT
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_read ON public.notifications(user_id, read);

-- Create function to notify solicitud owner when new offer is created
CREATE OR REPLACE FUNCTION public.notify_on_new_offer()
RETURNS TRIGGER AS $$
DECLARE
  solicitud_record RECORD;
  workshop_name TEXT;
BEGIN
  -- Get solicitud details
  SELECT s.user_id, s.device_brand, s.device_model
  INTO solicitud_record
  FROM public.solicitudes s
  WHERE s.id = NEW.solicitud_id;

  -- Get workshop name
  SELECT p.workshop_name INTO workshop_name
  FROM public.profiles p
  WHERE p.user_id = NEW.workshop_id;

  -- Insert notification for solicitud owner
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    solicitud_record.user_id,
    'new_offer',
    'Nueva oferta recibida',
    COALESCE(workshop_name, 'Un taller') || ' ha enviado una oferta para tu ' || solicitud_record.device_brand || ' ' || solicitud_record.device_model,
    '/solicitud/' || NEW.solicitud_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for new offers
CREATE TRIGGER on_new_offer_notification
AFTER INSERT ON public.ofertas
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_new_offer();

-- Create function to notify workshop when their offer is accepted
CREATE OR REPLACE FUNCTION public.notify_on_offer_accepted()
RETURNS TRIGGER AS $$
DECLARE
  offer_record RECORD;
  solicitud_record RECORD;
BEGIN
  -- Only trigger when selected_offer_id changes from null to a value
  IF OLD.selected_offer_id IS NULL AND NEW.selected_offer_id IS NOT NULL THEN
    -- Get offer details
    SELECT o.workshop_id INTO offer_record
    FROM public.ofertas o
    WHERE o.id = NEW.selected_offer_id;

    -- Insert notification for workshop
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      offer_record.workshop_id,
      'offer_accepted',
      '¡Tu oferta ha sido aceptada!',
      'Un cliente ha aceptado tu oferta para reparar su ' || NEW.device_brand || ' ' || NEW.device_model,
      '/solicitud/' || NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for offer acceptance
CREATE TRIGGER on_offer_accepted_notification
AFTER UPDATE ON public.solicitudes
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_offer_accepted();

-- Create function to notify on status changes
CREATE OR REPLACE FUNCTION public.notify_on_status_change()
RETURNS TRIGGER AS $$
DECLARE
  status_messages JSONB := '{
    "en_camino_taller": "Tu dispositivo está en camino al taller",
    "diagnostico": "El taller está diagnosticando tu dispositivo",
    "presupuesto_final": "Tienes un presupuesto final para revisar",
    "en_reparacion": "Tu dispositivo está siendo reparado",
    "reparado": "¡Tu dispositivo ha sido reparado!",
    "en_camino_cliente": "Tu dispositivo está en camino de vuelta",
    "completado": "¡Reparación completada con éxito!"
  }'::JSONB;
  message_text TEXT;
BEGIN
  -- Only trigger when status actually changes
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    message_text := status_messages ->> NEW.status::TEXT;
    
    IF message_text IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, type, title, message, link)
      VALUES (
        NEW.user_id,
        'status_change',
        'Actualización de estado',
        message_text || ' (' || NEW.device_brand || ' ' || NEW.device_model || ')',
        '/solicitud/' || NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for status changes
CREATE TRIGGER on_status_change_notification
AFTER UPDATE ON public.solicitudes
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_status_change();