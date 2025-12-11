-- DATA TYPES & ENUMS
CREATE TYPE app_role AS ENUM ('customer', 'workshop');
CREATE TYPE offer_status AS ENUM ('pendiente', 'aceptada', 'rechazada');
CREATE TYPE repair_status AS ENUM (
    'esperando_ofertas',
    'oferta_seleccionada',
    'en_camino_taller',
    'diagnostico',
    'presupuesto_final',
    'negociando',
    'en_reparacion',
    'reparado',
    'en_camino_cliente',
    'completado',
    'cancelado'
);

-- TABLES

-- PROFILES (Synced with Auth)
CREATE TABLE public.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name text,
    avatar_url text,
    is_workshop boolean DEFAULT false,
    workshop_name text,
    workshop_description text,
    workshop_city text,
    workshop_rating numeric,
    workshop_reviews_count integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- SOLICITUDES
CREATE TABLE public.solicitudes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id),
    device_brand text NOT NULL,
    device_model text NOT NULL,
    device_type text NOT NULL,
    problem_description text NOT NULL,
    problem_category text,
    images text[],
    city text NOT NULL,
    status repair_status DEFAULT 'esperando_ofertas',
    selected_offer_id uuid, -- Circular ref, added later or nullable
    counter_offer_count integer DEFAULT 0,
    diagnosis_paid boolean DEFAULT false,
    final_quote_paid boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- OFERTAS
CREATE TABLE public.ofertas (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    solicitud_id uuid NOT NULL REFERENCES public.solicitudes(id) ON DELETE CASCADE,
    workshop_id uuid NOT NULL REFERENCES auth.users(id),
    status offer_status DEFAULT 'pendiente',
    estimated_cost_min numeric NOT NULL,
    estimated_cost_max numeric NOT NULL,
    diagnosis_cost numeric NOT NULL,
    transport_cost numeric NOT NULL,
    estimated_days integer NOT NULL,
    message text,
    final_quote numeric,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- SHIPMENTS
CREATE TABLE public.shipments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    solicitud_id uuid NOT NULL REFERENCES public.solicitudes(id) ON DELETE CASCADE,
    tracking_number text NOT NULL,
    type text NOT NULL, -- e.g. 'to_workshop', 'to_customer'
    status text DEFAULT 'pending',
    carrier text, -- Kept for compatibility if code uses it, though we saw issues
    origin_name text,
    origin_city text,
    destination_name text,
    destination_city text,
    estimated_delivery timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- SHIPMENT HISTORY
CREATE TABLE public.shipment_status_history (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    status text NOT NULL,
    location text,
    notes text,
    created_at timestamptz DEFAULT now()
);

-- REVIEWS
CREATE TABLE public.reviews (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    solicitud_id uuid NOT NULL REFERENCES public.solicitudes(id),
    customer_id uuid NOT NULL REFERENCES auth.users(id),
    workshop_id uuid NOT NULL REFERENCES auth.users(id),
    rating numeric NOT NULL,
    comment text,
    created_at timestamptz DEFAULT now()
);

-- CONVERSATIONS & MESSAGES (Basic Chat)
CREATE TABLE public.conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    solicitud_id uuid REFERENCES public.solicitudes(id),
    customer_id uuid NOT NULL REFERENCES auth.users(id),
    workshop_id uuid NOT NULL REFERENCES auth.users(id),
    last_message_at timestamptz,
    created_at timestamptz DEFAULT now()
);

CREATE TABLE public.messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES auth.users(id),
    content text NOT NULL,
    read boolean DEFAULT false,
    created_at timestamptz DEFAULT now()
);

-- RLS POLICIES (Simplified for Local Dev - Open Access or Owner Access)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solicitudes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ofertas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments ENABLE ROW LEVEL SECURITY;

-- Allow everything for now in local dev or use simple policies
CREATE POLICY "Enable all for users" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for requests" ON public.solicitudes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for offers" ON public.ofertas FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all for shipments" ON public.shipments FOR ALL USING (true) WITH CHECK (true);

-- STORAGE BUCKETS (If needed)
insert into storage.buckets (id, name, public) values ('images', 'images', true) ON CONFLICT DO NOTHING;
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;
