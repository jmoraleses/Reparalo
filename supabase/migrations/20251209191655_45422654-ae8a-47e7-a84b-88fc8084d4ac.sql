-- Create enum for repair status
CREATE TYPE public.repair_status AS ENUM (
  'esperando_ofertas',
  'oferta_seleccionada',
  'en_camino_taller',
  'diagnostico',
  'presupuesto_final',
  'en_reparacion',
  'reparado',
  'en_camino_cliente',
  'completado',
  'cancelado'
);

-- Create enum for offer status
CREATE TYPE public.offer_status AS ENUM (
  'pendiente',
  'aceptada',
  'rechazada'
);

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  avatar_url TEXT,
  is_workshop BOOLEAN NOT NULL DEFAULT false,
  workshop_name TEXT,
  workshop_description TEXT,
  workshop_city TEXT,
  workshop_rating NUMERIC(3,2) DEFAULT 0,
  workshop_reviews_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create solicitudes (repair requests) table
CREATE TABLE public.solicitudes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_type TEXT NOT NULL,
  device_brand TEXT NOT NULL,
  device_model TEXT NOT NULL,
  problem_description TEXT NOT NULL,
  problem_category TEXT,
  images TEXT[],
  city TEXT NOT NULL,
  status public.repair_status NOT NULL DEFAULT 'esperando_ofertas',
  selected_offer_id UUID,
  diagnosis_paid BOOLEAN DEFAULT false,
  final_quote_paid BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create ofertas (offers/quotes) table
CREATE TABLE public.ofertas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  solicitud_id UUID NOT NULL REFERENCES public.solicitudes(id) ON DELETE CASCADE,
  workshop_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  estimated_cost_min NUMERIC(10,2) NOT NULL,
  estimated_cost_max NUMERIC(10,2) NOT NULL,
  diagnosis_cost NUMERIC(10,2) NOT NULL,
  transport_cost NUMERIC(10,2) NOT NULL,
  estimated_days INTEGER NOT NULL,
  message TEXT,
  status public.offer_status NOT NULL DEFAULT 'pendiente',
  final_quote NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitudes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ofertas ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Solicitudes policies
CREATE POLICY "Solicitudes are viewable by everyone"
ON public.solicitudes FOR SELECT
USING (true);

CREATE POLICY "Users can create their own solicitudes"
ON public.solicitudes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own solicitudes"
ON public.solicitudes FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own solicitudes"
ON public.solicitudes FOR DELETE
USING (auth.uid() = user_id);

-- Ofertas policies
CREATE POLICY "Ofertas are viewable by solicitud owner and workshop"
ON public.ofertas FOR SELECT
USING (
  auth.uid() = workshop_id OR 
  auth.uid() IN (SELECT user_id FROM public.solicitudes WHERE id = solicitud_id)
);

CREATE POLICY "Workshops can create ofertas"
ON public.ofertas FOR INSERT
WITH CHECK (auth.uid() = workshop_id);

CREATE POLICY "Workshops can update their own ofertas"
ON public.ofertas FOR UPDATE
USING (auth.uid() = workshop_id);

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_solicitudes_updated_at
BEFORE UPDATE ON public.solicitudes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ofertas_updated_at
BEFORE UPDATE ON public.ofertas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name)
  VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();