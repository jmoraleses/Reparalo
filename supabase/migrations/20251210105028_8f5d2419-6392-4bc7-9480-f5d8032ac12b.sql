-- Create function to notify on counter offer status change
CREATE OR REPLACE FUNCTION public.notify_on_counter_offer_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  solicitud_record RECORD;
  offer_record RECORD;
  recipient_id UUID;
  notification_title TEXT;
  notification_message TEXT;
  proposer_name TEXT;
BEGIN
  -- Only trigger when status changes from pending to accepted or rejected
  IF OLD.status = 'pending' AND (NEW.status = 'accepted' OR NEW.status = 'rejected') THEN
    -- Get solicitud details
    SELECT s.user_id, s.device_brand, s.device_model
    INTO solicitud_record
    FROM public.solicitudes s
    WHERE s.id = NEW.solicitud_id;

    -- Get offer details (workshop_id)
    SELECT o.workshop_id INTO offer_record
    FROM public.ofertas o
    WHERE o.id = NEW.offer_id;

    -- Determine recipient based on who proposed the counter offer
    IF NEW.proposed_by = 'customer' THEN
      -- Customer proposed, notify customer about workshop's decision
      recipient_id := solicitud_record.user_id;
      SELECT COALESCE(p.workshop_name, 'El taller') INTO proposer_name
      FROM public.profiles p WHERE p.user_id = offer_record.workshop_id;
    ELSE
      -- Workshop proposed, notify workshop about customer's decision
      recipient_id := offer_record.workshop_id;
      SELECT COALESCE(p.full_name, 'El cliente') INTO proposer_name
      FROM public.profiles p WHERE p.user_id = solicitud_record.user_id;
    END IF;

    -- Set notification content based on status
    IF NEW.status = 'accepted' THEN
      notification_title := '¡Contraoferta aceptada!';
      notification_message := proposer_name || ' ha aceptado tu contraoferta de ' || NEW.amount || '€ para ' || solicitud_record.device_brand || ' ' || solicitud_record.device_model;
    ELSE
      notification_title := 'Contraoferta rechazada';
      notification_message := proposer_name || ' ha rechazado tu contraoferta de ' || NEW.amount || '€ para ' || solicitud_record.device_brand || ' ' || solicitud_record.device_model;
    END IF;

    -- Insert notification
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      recipient_id,
      'counter_offer_' || NEW.status,
      notification_title,
      notification_message,
      '/solicitud/' || NEW.solicitud_id
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- Create trigger for counter offer status changes
DROP TRIGGER IF EXISTS on_counter_offer_status_change ON public.counter_offers;
CREATE TRIGGER on_counter_offer_status_change
  AFTER UPDATE ON public.counter_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_counter_offer_status_change();

-- Create function to notify when a new counter offer is created
CREATE OR REPLACE FUNCTION public.notify_on_new_counter_offer()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  solicitud_record RECORD;
  offer_record RECORD;
  recipient_id UUID;
  proposer_name TEXT;
BEGIN
  -- Get solicitud details
  SELECT s.user_id, s.device_brand, s.device_model
  INTO solicitud_record
  FROM public.solicitudes s
  WHERE s.id = NEW.solicitud_id;

  -- Get offer details (workshop_id)
  SELECT o.workshop_id INTO offer_record
  FROM public.ofertas o
  WHERE o.id = NEW.offer_id;

  -- Determine recipient and proposer name
  IF NEW.proposed_by = 'customer' THEN
    -- Customer proposed, notify workshop
    recipient_id := offer_record.workshop_id;
    SELECT COALESCE(p.full_name, 'El cliente') INTO proposer_name
    FROM public.profiles p WHERE p.user_id = solicitud_record.user_id;
  ELSE
    -- Workshop proposed, notify customer
    recipient_id := solicitud_record.user_id;
    SELECT COALESCE(p.workshop_name, 'El taller') INTO proposer_name
    FROM public.profiles p WHERE p.user_id = offer_record.workshop_id;
  END IF;

  -- Insert notification
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    recipient_id,
    'new_counter_offer',
    'Nueva contraoferta recibida',
    proposer_name || ' ha propuesto ' || NEW.amount || '€ para ' || solicitud_record.device_brand || ' ' || solicitud_record.device_model,
    '/solicitud/' || NEW.solicitud_id
  );

  RETURN NEW;
END;
$function$;

-- Create trigger for new counter offers
DROP TRIGGER IF EXISTS on_new_counter_offer ON public.counter_offers;
CREATE TRIGGER on_new_counter_offer
  AFTER INSERT ON public.counter_offers
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_new_counter_offer();