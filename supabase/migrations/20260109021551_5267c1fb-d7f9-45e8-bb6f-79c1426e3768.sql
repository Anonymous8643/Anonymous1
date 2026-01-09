-- Add hide_balance column to profiles for privacy feature
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS hide_balance BOOLEAN DEFAULT false;

-- Create market_news table
CREATE TABLE IF NOT EXISTS public.market_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on market_news
ALTER TABLE public.market_news ENABLE ROW LEVEL SECURITY;

-- Anyone can view active market news
CREATE POLICY "Anyone can view active market news"
  ON public.market_news
  FOR SELECT
  USING (is_active = true);

-- Only admins can manage market news
CREATE POLICY "Admins can manage market news"
  ON public.market_news
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for market news images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'market-news',
  'market-news',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for market news bucket
CREATE POLICY "Public can view market news images"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'market-news');

CREATE POLICY "Admins can upload market news images"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'market-news' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete market news images"
  ON storage.objects
  FOR DELETE
  USING (bucket_id = 'market-news' AND has_role(auth.uid(), 'admin'::app_role));

-- Update handle_new_user trigger to also insert into user_roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data ->> 'full_name');
  
  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id);
  
  INSERT INTO public.user_streaks (user_id)
  VALUES (NEW.id);
  
  INSERT INTO public.user_levels (user_id)
  VALUES (NEW.id);
  
  -- Auto-insert user role for all new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- Add RLS policy for admins to view all profiles (needed for admin dashboard)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy for admins to view all wallets
CREATE POLICY "Admins can view all wallets"
  ON public.wallets
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy for admins to update all wallets
CREATE POLICY "Admins can update all wallets"
  ON public.wallets
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add RLS policy for admins to insert transactions for any user
CREATE POLICY "Admins can insert transactions"
  ON public.transactions
  FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for market_news updated_at
CREATE TRIGGER update_market_news_updated_at
  BEFORE UPDATE ON public.market_news
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();