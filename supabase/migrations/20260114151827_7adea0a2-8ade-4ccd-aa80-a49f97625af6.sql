-- Create table for payment screenshots/testimonials
CREATE TABLE public.payment_screenshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT NOT NULL,
  caption TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0
);

-- Enable RLS
ALTER TABLE public.payment_screenshots ENABLE ROW LEVEL SECURITY;

-- Anyone can view active screenshots
CREATE POLICY "Anyone can view active payment screenshots"
ON public.payment_screenshots
FOR SELECT
USING (is_active = true);

-- Admins can manage all screenshots
CREATE POLICY "Admins can manage payment screenshots"
ON public.payment_screenshots
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create storage bucket for payment screenshots
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-screenshots', 'payment-screenshots', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for payment screenshots bucket
CREATE POLICY "Anyone can view payment screenshots"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-screenshots');

CREATE POLICY "Admins can upload payment screenshots"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-screenshots' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete payment screenshots"
ON storage.objects FOR DELETE
USING (bucket_id = 'payment-screenshots' AND has_role(auth.uid(), 'admin'::app_role));