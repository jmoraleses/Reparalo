-- Create conversations table
CREATE TABLE public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  solicitud_id UUID REFERENCES public.solicitudes(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL,
  workshop_id UUID NOT NULL,
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Conversations policies
CREATE POLICY "Users can view their own conversations"
ON public.conversations
FOR SELECT
USING (auth.uid() = customer_id OR auth.uid() = workshop_id);

CREATE POLICY "Users can create conversations they're part of"
ON public.conversations
FOR INSERT
WITH CHECK (auth.uid() = customer_id OR auth.uid() = workshop_id);

CREATE POLICY "Users can update their own conversations"
ON public.conversations
FOR UPDATE
USING (auth.uid() = customer_id OR auth.uid() = workshop_id);

-- Messages policies
CREATE POLICY "Users can view messages in their conversations"
ON public.messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND (c.customer_id = auth.uid() OR c.workshop_id = auth.uid())
  )
);

CREATE POLICY "Users can send messages in their conversations"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = messages.conversation_id
    AND (c.customer_id = auth.uid() OR c.workshop_id = auth.uid())
  )
);

CREATE POLICY "Users can update messages they sent"
ON public.messages
FOR UPDATE
USING (auth.uid() = sender_id);

-- Indexes for performance
CREATE INDEX idx_conversations_customer ON public.conversations(customer_id);
CREATE INDEX idx_conversations_workshop ON public.conversations(workshop_id);
CREATE INDEX idx_messages_conversation ON public.messages(conversation_id);
CREATE INDEX idx_messages_created ON public.messages(conversation_id, created_at);

-- Function to update last_message_at
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to update last_message_at when new message is sent
CREATE TRIGGER on_new_message_update_conversation
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.update_conversation_last_message();

-- Function to notify on new message
CREATE OR REPLACE FUNCTION public.notify_on_new_message()
RETURNS TRIGGER AS $$
DECLARE
  conv_record RECORD;
  recipient_id UUID;
  sender_name TEXT;
BEGIN
  -- Get conversation details
  SELECT c.customer_id, c.workshop_id, c.solicitud_id
  INTO conv_record
  FROM public.conversations c
  WHERE c.id = NEW.conversation_id;

  -- Determine recipient (the other party)
  IF NEW.sender_id = conv_record.customer_id THEN
    recipient_id := conv_record.workshop_id;
  ELSE
    recipient_id := conv_record.customer_id;
  END IF;

  -- Get sender name
  SELECT COALESCE(p.workshop_name, p.full_name, 'Usuario') INTO sender_name
  FROM public.profiles p
  WHERE p.user_id = NEW.sender_id;

  -- Create notification for recipient
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    recipient_id,
    'message',
    'Nuevo mensaje',
    sender_name || ': ' || LEFT(NEW.content, 50) || CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END,
    '/mensajes'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for message notifications
CREATE TRIGGER on_new_message_notification
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.notify_on_new_message();

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;