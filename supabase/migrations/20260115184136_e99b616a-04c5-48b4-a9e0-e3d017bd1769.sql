-- Create table for admin messages to users (warnings, notifications, etc.)
CREATE TABLE public.admin_user_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  admin_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'warning', -- 'warning', 'info', 'success'
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_user_messages ENABLE ROW LEVEL SECURITY;

-- Admins can manage all messages
CREATE POLICY "Admins can manage user messages"
ON public.admin_user_messages
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own messages
CREATE POLICY "Users can view their own messages"
ON public.admin_user_messages
FOR SELECT
USING (auth.uid() = user_id);

-- Users can update their own messages (mark as read)
CREATE POLICY "Users can update their own messages"
ON public.admin_user_messages
FOR UPDATE
USING (auth.uid() = user_id);

-- Update handle_new_user function to auto-assign personal manager
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  selected_manager_id UUID;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  
  -- Create wallet
  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id);
  
  -- Create streak record
  INSERT INTO public.user_streaks (user_id)
  VALUES (NEW.id);
  
  -- Create level record
  INSERT INTO public.user_levels (user_id)
  VALUES (NEW.id);
  
  -- Auto-insert user role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  -- Auto-assign personal manager (the one with lowest assigned_count)
  SELECT id INTO selected_manager_id
  FROM public.personal_managers
  WHERE is_active = true
  ORDER BY assigned_count ASC, created_at ASC
  LIMIT 1;
  
  IF selected_manager_id IS NOT NULL THEN
    -- Update profile with assigned manager
    UPDATE public.profiles
    SET assigned_manager_id = selected_manager_id
    WHERE user_id = NEW.id;
    
    -- Increment the manager's assigned count
    UPDATE public.personal_managers
    SET assigned_count = assigned_count + 1
    WHERE id = selected_manager_id;
  END IF;
  
  RETURN NEW;
END;
$$;