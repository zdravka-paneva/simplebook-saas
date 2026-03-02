-- Add 'admin' role to account_type enum
ALTER TYPE public.account_type ADD VALUE 'admin' BEFORE 'business';

-- Add admin RLS policy for profiles table
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (
  (SELECT account_type FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
);

-- Add admin RLS policy for services table
CREATE POLICY "Admins can view and manage all services"
ON public.services FOR ALL
USING (
  (SELECT account_type FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
);

-- Add admin RLS policy for appointments table
CREATE POLICY "Admins can view and manage all appointments"
ON public.appointments FOR ALL
USING (
  (SELECT account_type FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
);

-- Add admin RLS policy for clients table
CREATE POLICY "Admins can view and manage all clients"
ON public.clients FOR ALL
USING (
  (SELECT account_type FROM public.profiles WHERE user_id = auth.uid()) = 'admin'
);