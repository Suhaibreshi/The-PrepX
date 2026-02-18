-- Link existing admin user to user_profiles
INSERT INTO public.user_profiles (id, full_name, role)
SELECT id, COALESCE(raw_user_meta_data->>'full_name', 'Admin'), 'super_admin'
FROM auth.users
WHERE email = 'admin@prepxiq.com'
ON CONFLICT (id) DO UPDATE SET role = 'super_admin';
