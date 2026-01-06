import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

// Types
export interface UserStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_login_date: string | null;
  total_login_days: number;
  streak_freeze_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  tier: "bronze" | "silver" | "gold" | "platinum" | "diamond";
  reward_amount: number;
  xp_reward: number;
  requirement_type: string;
  requirement_value: number;
  is_active: boolean;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  achieved_at: string;
  reward_claimed: boolean;
  achievement?: Achievement;
}

export interface UserLevel {
  id: string;
  user_id: string;
  current_level: number;
  current_xp: number;
  total_xp: number;
  level_title: string;
  created_at: string;
  updated_at: string;
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  target_value: number;
  reward_amount: number;
  xp_reward: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
}

export interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  current_progress: number;
  completed: boolean;
  reward_claimed: boolean;
  joined_at: string;
  completed_at: string | null;
  challenge?: WeeklyChallenge;
}

export interface SpinHistory {
  id: string;
  user_id: string;
  prize_type: string;
  prize_value: number;
  spin_date: string;
  created_at: string;
}

// Level configuration
export const LEVEL_CONFIG = [
  { level: 1, title: "Beginner", xp_required: 0, benefits: [] },
  { level: 2, title: "Apprentice", xp_required: 100, benefits: ["Profile badge"] },
  { level: 3, title: "Investor", xp_required: 300, benefits: ["Faster withdrawals (24h)"] },
  { level: 4, title: "Trader", xp_required: 600, benefits: ["+0.5% returns"] },
  { level: 5, title: "Expert", xp_required: 1000, benefits: ["+1% returns", "Priority support"] },
  { level: 6, title: "Master", xp_required: 1500, benefits: ["Exclusive products"] },
  { level: 7, title: "Elite", xp_required: 2200, benefits: ["+1.5% returns"] },
  { level: 8, title: "Champion", xp_required: 3000, benefits: ["VIP events access"] },
  { level: 9, title: "Legend", xp_required: 4000, benefits: ["+2% returns"] },
  { level: 10, title: "Grandmaster", xp_required: 5500, benefits: ["Maximum benefits", "Dedicated manager"] },
];

// Streak reward configuration
export const STREAK_REWARDS: Record<number, number> = {
  1: 10,
  3: 25,
  7: 50,
  14: 100,
  21: 200,
  30: 500,
};

// Hooks
export const useUserStreak = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-streak", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as UserStreak | null;
    },
    enabled: !!user,
  });
};

export const useUpdateStreak = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");

      const today = new Date().toISOString().split("T")[0];

      // Get current streak
      const { data: currentStreak } = await supabase
        .from("user_streaks")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (!currentStreak) {
        // Create new streak record
        const { data, error } = await supabase
          .from("user_streaks")
          .insert({
            user_id: user.id,
            current_streak: 1,
            longest_streak: 1,
            last_login_date: today,
            total_login_days: 1,
          })
          .select()
          .single();

        if (error) throw error;
        return { data, isNewDay: true, streakBroken: false };
      }

      // Check if already logged in today
      if (currentStreak.last_login_date === today) {
        return { data: currentStreak, isNewDay: false, streakBroken: false };
      }

      // Check if streak should continue or break
      const lastLogin = currentStreak.last_login_date ? new Date(currentStreak.last_login_date) : null;
      const todayDate = new Date(today);
      const daysDiff = lastLogin ? Math.floor((todayDate.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)) : 999;

      let newStreak = 1;
      let streakBroken = false;

      if (daysDiff === 1) {
        // Consecutive day
        newStreak = currentStreak.current_streak + 1;
      } else if (daysDiff > 1) {
        // Streak broken
        streakBroken = true;
        newStreak = 1;
      }

      const { data, error } = await supabase
        .from("user_streaks")
        .update({
          current_streak: newStreak,
          longest_streak: Math.max(newStreak, currentStreak.longest_streak),
          last_login_date: today,
          total_login_days: currentStreak.total_login_days + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return { data, isNewDay: true, streakBroken };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-streak", user?.id] });
    },
  });
};

export const useAchievements = () => {
  return useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("achievements")
        .select("*")
        .eq("is_active", true)
        .order("requirement_value", { ascending: true });

      if (error) throw error;
      return data as Achievement[];
    },
  });
};

export const useUserAchievements = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-achievements", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_achievements")
        .select(`
          *,
          achievement:achievements(*)
        `)
        .eq("user_id", user.id)
        .order("achieved_at", { ascending: false });

      if (error) throw error;
      return data as UserAchievement[];
    },
    enabled: !!user,
  });
};

export const useUserLevel = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-level", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("user_levels")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data as UserLevel | null;
    },
    enabled: !!user,
  });
};

export const useAddXP = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (xpAmount: number) => {
      if (!user) throw new Error("Not authenticated");

      let { data: currentLevel } = await supabase
        .from("user_levels")
        .select("*")
        .eq("user_id", user.id)
        .single();

      // Create level record if it doesn't exist (for users created before migration)
      if (!currentLevel) {
        const { data: newLevel, error: createError } = await supabase
          .from("user_levels")
          .insert({ user_id: user.id })
          .select()
          .single();
        
        if (createError) throw createError;
        currentLevel = newLevel;
      }

      if (!currentLevel) throw new Error("User level not found");

      const newTotalXP = currentLevel.total_xp + xpAmount;
      const newCurrentXP = currentLevel.current_xp + xpAmount;

      // Calculate new level
      let newLevel = currentLevel.current_level;
      let newTitle = currentLevel.level_title;
      let remainingXP = newCurrentXP;

      for (const config of LEVEL_CONFIG) {
        if (newTotalXP >= config.xp_required) {
          newLevel = config.level;
          newTitle = config.title;
          remainingXP = newTotalXP - config.xp_required;
        }
      }

      const { data, error } = await supabase
        .from("user_levels")
        .update({
          current_level: newLevel,
          current_xp: remainingXP,
          total_xp: newTotalXP,
          level_title: newTitle,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return { data, leveledUp: newLevel > currentLevel.current_level };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-level", user?.id] });
    },
  });
};

export const useWeeklyChallenges = () => {
  return useQuery({
    queryKey: ["weekly-challenges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_challenges")
        .select("*")
        .eq("is_active", true)
        .gt("ends_at", new Date().toISOString())
        .order("ends_at", { ascending: true });

      if (error) throw error;
      return data as WeeklyChallenge[];
    },
  });
};

export const useUserChallenges = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-challenges", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("user_challenges")
        .select(`
          *,
          challenge:weekly_challenges(*)
        `)
        .eq("user_id", user.id)
        .order("joined_at", { ascending: false });

      if (error) throw error;
      return data as UserChallenge[];
    },
    enabled: !!user,
  });
};

export const useJoinChallenge = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (challengeId: string) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("user_challenges")
        .insert({
          user_id: user.id,
          challenge_id: challengeId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-challenges", user?.id] });
    },
  });
};

export const useTodaySpins = () => {
  const { user } = useAuth();
  const today = new Date().toISOString().split("T")[0];

  return useQuery({
    queryKey: ["today-spins", user?.id, today],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("spin_history")
        .select("*")
        .eq("user_id", user.id)
        .eq("spin_date", today);

      if (error) throw error;
      return data as SpinHistory[];
    },
    enabled: !!user,
  });
};

export const useRecordSpin = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ prizeType, prizeValue }: { prizeType: string; prizeValue: number }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("spin_history")
        .insert({
          user_id: user.id,
          prize_type: prizeType,
          prize_value: prizeValue,
          spin_date: new Date().toISOString().split("T")[0],
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["today-spins", user?.id] });
    },
  });
};
