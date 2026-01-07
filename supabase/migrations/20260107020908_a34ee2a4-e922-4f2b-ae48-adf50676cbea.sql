-- Create enum for admin roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table for secure role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
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

-- RLS policy for user_roles - users can view their own roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all roles
CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create payment_numbers table for rolling M-PESA numbers
CREATE TABLE public.payment_numbers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number TEXT NOT NULL UNIQUE,
    account_name TEXT NOT NULL DEFAULT 'InvesterMate',
    is_active BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on payment_numbers
ALTER TABLE public.payment_numbers ENABLE ROW LEVEL SECURITY;

-- Anyone can view active payment numbers
CREATE POLICY "Anyone can view active payment numbers"
ON public.payment_numbers
FOR SELECT
USING (is_active = true);

-- Admins can manage payment numbers
CREATE POLICY "Admins can manage payment numbers"
ON public.payment_numbers
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create pending_deposits table for manual approval
CREATE TABLE public.pending_deposits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    amount NUMERIC NOT NULL,
    phone_number TEXT NOT NULL,
    mpesa_code TEXT,
    payment_number_used TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on pending_deposits
ALTER TABLE public.pending_deposits ENABLE ROW LEVEL SECURITY;

-- Users can view their own pending deposits
CREATE POLICY "Users can view their own deposits"
ON public.pending_deposits
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own deposits
CREATE POLICY "Users can create deposits"
ON public.pending_deposits
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all deposits
CREATE POLICY "Admins can view all deposits"
ON public.pending_deposits
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update deposits
CREATE POLICY "Admins can update deposits"
ON public.pending_deposits
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Create pending_withdrawals table
CREATE TABLE public.pending_withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    amount NUMERIC NOT NULL,
    phone_number TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    admin_notes TEXT,
    processed_by UUID,
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on pending_withdrawals
ALTER TABLE public.pending_withdrawals ENABLE ROW LEVEL SECURITY;

-- Users can view their own withdrawals
CREATE POLICY "Users can view their own withdrawals"
ON public.pending_withdrawals
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own withdrawals
CREATE POLICY "Users can create withdrawals"
ON public.pending_withdrawals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all withdrawals
CREATE POLICY "Admins can view all withdrawals"
ON public.pending_withdrawals
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update withdrawals
CREATE POLICY "Admins can update withdrawals"
ON public.pending_withdrawals
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Create admin_audit_log for tracking admin actions
CREATE TABLE public.admin_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL,
    action TEXT NOT NULL,
    target_table TEXT,
    target_id UUID,
    details JSONB,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on admin_audit_log
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view and insert audit logs
CREATE POLICY "Admins can view audit logs"
ON public.admin_audit_log
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert audit logs"
ON public.admin_audit_log
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Insert default payment numbers
INSERT INTO public.payment_numbers (phone_number, account_name, priority) VALUES
('0745745186', 'InvesterMate', 1),
('0105443364', 'InvesterMate', 2),
('0745088900', 'InvesterMate', 3);

-- Update products table with better returns
UPDATE public.products SET expected_return = price * 1.35 WHERE category = 'Standard';
UPDATE public.products SET expected_return = price * 1.45 WHERE category = 'Premium';
UPDATE public.products SET expected_return = price * 1.60 WHERE category = 'VIP';