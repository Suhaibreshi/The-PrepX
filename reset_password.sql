-- Reset admin password
-- Run this in Supabase SQL Editor

UPDATE auth.users 
SET encrypted_password = crypt('admin123456', gen_salt('bf'))
WHERE email = 'admin@prepxiq.com';
