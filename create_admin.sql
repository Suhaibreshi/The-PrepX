-- Manual admin user creation (run this in Supabase SQL Editor)
-- Step 1: Create auth user with password
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@prepxiq.com',
  crypt('admin123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{"full_name":"Admin"}',
  now(),
  now(),
  '',
  '',
  '',
  ''
)
RETURNING id;

-- Step 2: After getting the ID from above, insert into user_profiles
-- Replace YOUR_USER_ID with the ID returned from step 1
INSERT INTO public.user_profiles (id, full_name, role)
VALUES ('REPLACE_WITH_USER_ID_FROM_STEP_1', 'Admin', 'super_admin');
