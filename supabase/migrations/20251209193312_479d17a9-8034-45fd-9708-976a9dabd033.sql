-- Create demo users using Supabase auth helper
-- Note: These will be created with auto-confirm enabled

-- First, create the demo customer user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  'a0000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'demouser@demo.com',
  crypt('demo', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Usuario Demo"}',
  false,
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Create the demo workshop user
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud,
  confirmation_token,
  recovery_token,
  email_change_token_new,
  email_change
) VALUES (
  'a0000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'demotaller@demo.com',
  crypt('demo', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Taller Demo"}',
  false,
  'authenticated',
  'authenticated',
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO NOTHING;

-- Create profiles for demo users
INSERT INTO public.profiles (user_id, full_name, is_workshop, workshop_name, workshop_city, workshop_description, workshop_rating, workshop_reviews_count)
VALUES 
  ('a0000000-0000-0000-0000-000000000001', 'Usuario Demo', false, NULL, NULL, NULL, NULL, NULL),
  ('a0000000-0000-0000-0000-000000000002', 'Taller Demo', true, 'TechFix Demo', 'Madrid', 'Taller de demostración especializado en reparación de dispositivos electrónicos', 4.8, 127)
ON CONFLICT (user_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  is_workshop = EXCLUDED.is_workshop,
  workshop_name = EXCLUDED.workshop_name,
  workshop_city = EXCLUDED.workshop_city,
  workshop_description = EXCLUDED.workshop_description;

-- Add workshop role for demo taller
INSERT INTO public.user_roles (user_id, role, verified_at)
VALUES ('a0000000-0000-0000-0000-000000000002', 'workshop', now())
ON CONFLICT DO NOTHING;

-- Add customer role for demo user
INSERT INTO public.user_roles (user_id, role)
VALUES ('a0000000-0000-0000-0000-000000000001', 'customer')
ON CONFLICT DO NOTHING;