-- Create suspicious activity log table
CREATE TABLE public.suspicious_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  browser TEXT,
  device TEXT,
  location TEXT,
  severity TEXT NOT NULL DEFAULT 'low',
  details JSONB DEFAULT '{}',
  resolved BOOLEAN DEFAULT false,
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.suspicious_activities ENABLE ROW LEVEL SECURITY;

-- Admin can view and manage suspicious activities
CREATE POLICY "Admins can view suspicious activities"
ON public.suspicious_activities
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert suspicious activities"
ON public.suspicious_activities
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update suspicious activities"
ON public.suspicious_activities
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Also allow the system (service role) to insert suspicious activities
CREATE POLICY "System can insert suspicious activities"
ON public.suspicious_activities
FOR INSERT
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX idx_suspicious_activities_user ON public.suspicious_activities(user_id);
CREATE INDEX idx_suspicious_activities_severity ON public.suspicious_activities(severity);
CREATE INDEX idx_suspicious_activities_created ON public.suspicious_activities(created_at DESC);