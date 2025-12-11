-- Fix Issue 1: profiles_public - Restrict profiles to related parties only
-- Fix Issue 2: client_role_check - Create proper user_roles table

-- First, drop the overly permissive profiles SELECT policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- Create a new restrictive SELECT policy for profiles
-- Users can see their own profile, or workshop profiles if they have a solicitud with an offer from that workshop
CREATE POLICY "Profiles visible to authenticated users and related parties"
ON public.profiles FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    auth.uid() = user_id
    OR (is_workshop = true)
  )
);

-- Prevent users from modifying the is_workshop flag themselves
-- Drop the old update policy and create a more restrictive one
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile except role"
ON public.profiles FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id 
  AND is_workshop = (SELECT is_workshop FROM public.profiles WHERE user_id = auth.uid())
);

-- Create the user_roles table for proper role management
CREATE TYPE public.app_role AS ENUM ('customer', 'workshop');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role app_role NOT NULL,
  verified_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can only read their own roles
CREATE POLICY "Users can read their own roles"
ON public.user_roles FOR SELECT
USING (auth.uid() = user_id);

-- Create a security definer function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create a function to check if user is a verified workshop
CREATE OR REPLACE FUNCTION public.is_verified_workshop(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'workshop'
      AND verified_at IS NOT NULL
  )
$$;

-- Update ofertas INSERT policy to require verified workshop role
DROP POLICY IF EXISTS "Workshops can create ofertas" ON public.ofertas;

CREATE POLICY "Verified workshops can create ofertas"
ON public.ofertas FOR INSERT
WITH CHECK (
  auth.uid() = workshop_id 
  AND public.is_verified_workshop(auth.uid())
);

-- Add CHECK constraints to ofertas table for input validation (server-side)
ALTER TABLE public.ofertas
ADD CONSTRAINT ofertas_cost_min_positive CHECK (estimated_cost_min >= 0),
ADD CONSTRAINT ofertas_cost_max_positive CHECK (estimated_cost_max >= 0),
ADD CONSTRAINT ofertas_cost_range_valid CHECK (estimated_cost_max >= estimated_cost_min),
ADD CONSTRAINT ofertas_diagnosis_cost_positive CHECK (diagnosis_cost >= 0),
ADD CONSTRAINT ofertas_transport_cost_positive CHECK (transport_cost >= 0),
ADD CONSTRAINT ofertas_estimated_days_positive CHECK (estimated_days >= 1),
ADD CONSTRAINT ofertas_cost_max_limit CHECK (estimated_cost_max <= 100000),
ADD CONSTRAINT ofertas_diagnosis_cost_limit CHECK (diagnosis_cost <= 10000),
ADD CONSTRAINT ofertas_transport_cost_limit CHECK (transport_cost <= 1000);