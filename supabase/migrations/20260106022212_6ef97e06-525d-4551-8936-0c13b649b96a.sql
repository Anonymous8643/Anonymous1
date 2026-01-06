-- User Streaks Table for daily login tracking
CREATE TABLE public.user_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_login_date DATE,
  total_login_days INTEGER NOT NULL DEFAULT 0,
  streak_freeze_available BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Streak Rewards Table for milestone bonuses
CREATE TABLE public.streak_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  streak_day INTEGER NOT NULL,
  reward_amount NUMERIC NOT NULL DEFAULT 0,
  claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Achievements Table for badge definitions
CREATE TABLE public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'award',
  category TEXT NOT NULL DEFAULT 'general',
  tier TEXT NOT NULL DEFAULT 'bronze',
  reward_amount NUMERIC NOT NULL DEFAULT 0,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  requirement_type TEXT NOT NULL,
  requirement_value NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Achievements Junction Table
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  achieved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reward_claimed BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(user_id, achievement_id)
);

-- User Levels Table for XP progression
CREATE TABLE public.user_levels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_level INTEGER NOT NULL DEFAULT 1,
  current_xp INTEGER NOT NULL DEFAULT 0,
  total_xp INTEGER NOT NULL DEFAULT 0,
  level_title TEXT NOT NULL DEFAULT 'Beginner',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Weekly Challenges Table
CREATE TABLE public.weekly_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL,
  target_value NUMERIC NOT NULL,
  reward_amount NUMERIC NOT NULL DEFAULT 0,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User Challenge Progress Table
CREATE TABLE public.user_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.weekly_challenges(id) ON DELETE CASCADE,
  current_progress NUMERIC NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  reward_claimed BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(user_id, challenge_id)
);

-- Spin Wheel History Table
CREATE TABLE public.spin_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  prize_type TEXT NOT NULL,
  prize_value NUMERIC NOT NULL DEFAULT 0,
  spin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.streak_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spin_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_streaks
CREATE POLICY "Users can view their own streaks" ON public.user_streaks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own streaks" ON public.user_streaks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own streaks" ON public.user_streaks FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for streak_rewards
CREATE POLICY "Users can view their own streak rewards" ON public.streak_rewards FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own streak rewards" ON public.streak_rewards FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for achievements (public read)
CREATE POLICY "Anyone can view achievements" ON public.achievements FOR SELECT USING (is_active = true);

-- RLS Policies for user_achievements
CREATE POLICY "Users can view their own achievements" ON public.user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own achievements" ON public.user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own achievements" ON public.user_achievements FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for user_levels
CREATE POLICY "Users can view their own levels" ON public.user_levels FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own levels" ON public.user_levels FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own levels" ON public.user_levels FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for weekly_challenges (public read)
CREATE POLICY "Anyone can view active challenges" ON public.weekly_challenges FOR SELECT USING (is_active = true AND ends_at > now());

-- RLS Policies for user_challenges
CREATE POLICY "Users can view their own challenges" ON public.user_challenges FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own challenges" ON public.user_challenges FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own challenges" ON public.user_challenges FOR UPDATE USING (auth.uid() = user_id);

-- RLS Policies for spin_history
CREATE POLICY "Users can view their own spin history" ON public.spin_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own spins" ON public.spin_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update handle_new_user function to also create streak and level records
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
  
  RETURN NEW;
END;
$$;

-- Insert default achievements
INSERT INTO public.achievements (code, title, description, icon, category, tier, reward_amount, xp_reward, requirement_type, requirement_value) VALUES
('first_investment', 'First Investment', 'Made your first investment on the platform', 'trending-up', 'investing', 'bronze', 50, 25, 'investment_count', 1),
('10k_club', 'KES 10K Club', 'Invested a total of KES 10,000 or more', 'crown', 'investing', 'silver', 100, 50, 'total_invested', 10000),
('50k_club', 'KES 50K Club', 'Invested a total of KES 50,000 or more', 'gem', 'investing', 'gold', 250, 100, 'total_invested', 50000),
('100k_club', 'KES 100K Club', 'Invested a total of KES 100,000 or more', 'diamond', 'investing', 'platinum', 500, 200, 'total_invested', 100000),
('referral_master', 'Referral Master', 'Referred 5 friends to the platform', 'users', 'referral', 'gold', 200, 75, 'referral_count', 5),
('streak_7', 'Week Warrior', 'Maintained a 7-day login streak', 'flame', 'engagement', 'bronze', 50, 35, 'streak_days', 7),
('streak_30', 'Monthly Champion', 'Maintained a 30-day login streak', 'zap', 'engagement', 'gold', 300, 150, 'streak_days', 30),
('early_adopter', 'Early Adopter', 'Joined during the early stages of InvesterMate', 'star', 'special', 'diamond', 100, 50, 'special', 1),
('diversified', 'Diversified Portfolio', 'Invested in 5 different products', 'pie-chart', 'investing', 'silver', 150, 60, 'product_count', 5),
('quick_starter', 'Quick Starter', 'Made an investment within 24 hours of signing up', 'rocket', 'special', 'bronze', 75, 40, 'special', 1);

-- Insert sample weekly challenges
INSERT INTO public.weekly_challenges (title, description, challenge_type, target_value, reward_amount, xp_reward, starts_at, ends_at) VALUES
('Investment Sprint', 'Invest KES 20,000 this week', 'invest_amount', 20000, 500, 100, now(), now() + interval '7 days'),
('Referral Rush', 'Refer 3 friends to the platform', 'referral_count', 3, 300, 75, now(), now() + interval '7 days'),
('Daily Dedication', 'Log in every day for 7 days', 'login_streak', 7, 200, 50, now(), now() + interval '7 days');