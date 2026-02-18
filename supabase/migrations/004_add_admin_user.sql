-- Create admin user
-- Run this in Supabase SQL Editor to create an admin user

-- Step 1: Create the auth user
INSERT INTO auth.users (
  id,
  email,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  'admin@prepxiq.com',
  now(),
  now(),
  now(),
  '{"full_name": "Admin"}'
);

-- Step 2: Link to user_profiles with admin role (run after step 1)
-- Replace 'USER_ID' with the ID returned from step 1
INSERT INTO public.user_profiles (id, full_name, role)
VALUES (
  (SELECT id FROM auth.users WHERE email = 'admin@prepxiq.com'),
  'Admin',
  'super_admin'
);
