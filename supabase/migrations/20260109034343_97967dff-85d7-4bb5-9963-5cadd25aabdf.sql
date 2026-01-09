-- Create platform_settings table for global settings like freeze deposits/withdrawals
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}',
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read settings (needed for checking freeze status)
CREATE POLICY "Anyone can view platform settings" 
  ON public.platform_settings 
  FOR SELECT 
  USING (true);

-- Only admins can modify settings
CREATE POLICY "Admins can manage platform settings" 
  ON public.platform_settings 
  FOR ALL 
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default settings
INSERT INTO public.platform_settings (key, value) VALUES 
  ('deposits_frozen', '{"frozen": false}'::jsonb),
  ('withdrawals_frozen', '{"frozen": false}'::jsonb)
ON CONFLICT (key) DO NOTHING;