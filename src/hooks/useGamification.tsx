import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, UserStreak, UserLevel, Achievement, UserAchievement, WeeklyChallenge, UserChallenge, SpinHistory } from "@/lib/api";
import { useAuth } from "./useAuth";

export type { UserStreak, UserLevel, Achievement, UserAchievement, WeeklyChallenge, UserChallenge, SpinHistory };

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
      const { streak } = await api.gamification.getStreak();
      return streak;
    },
    enabled: !!user,
  });
};

export const useUpdateStreak = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { streak: currentStreak } = await api.gamification.getStreak();

      if (!currentStreak) {
        const { streak } = await api.gamification.updateStreak({
          current_streak: 1,
          longest_streak: 1,
          last_login_date: today,
          total_login_days: 1,
        });
        // Check if day 1 has a reward
        const reward = STREAK_REWARDS[1] || 0;
        return { data: streak, isNewDay: true, streakBroken: false, streakReward: reward };
      }

      if (currentStreak.last_login_date === today) {
        return { data: currentStreak, isNewDay: false, streakBroken: false, streakReward: 0 };
      }

      const lastLogin = currentStreak.last_login_date ? new Date(currentStreak.last_login_date) : null;
      const todayDate = new Date(today);
      const daysDiff = lastLogin ? Math.floor((todayDate.getTime() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)) : 999;

      let newStreak = 1;
      let streakBroken = false;

      if (daysDiff === 1) {
        newStreak = currentStreak.current_streak + 1;
      } else if (daysDiff > 1) {
        streakBroken = true;
        newStreak = 1;
      }

      const { streak } = await api.gamification.updateStreak({
        current_streak: newStreak,
        longest_streak: Math.max(newStreak, currentStreak.longest_streak),
        last_login_date: today,
        total_login_days: currentStreak.total_login_days + 1,
      });

      // Check if this streak day has a reward
      const reward = STREAK_REWARDS[newStreak] || 0;
      return { data: streak, isNewDay: true, streakBroken, streakReward: reward };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-streak", user?.id] });
    },
  });
};

// Claim streak reward - adds to wallet
export const useClaimStreakReward = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ streakDay, rewardAmount }: { streakDay: number; rewardAmount: number }) => {
      const { reward } = await api.gamification.claimStreakReward(streakDay, rewardAmount);
      return reward;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["user-streak", user?.id] });
    },
  });
};

export const useAchievements = () => {
  return useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const { achievements } = await api.public.achievements();
      return achievements;
    },
  });
};

export const useUserAchievements = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-achievements", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { achievements } = await api.gamification.getAchievements();
      return achievements;
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
      const { level } = await api.gamification.getLevel();
      return level;
    },
    enabled: !!user,
  });
};

export const useAddXP = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (xpAmount: number) => {
      // Get current level via API
      const { level: currentLevel } = await api.gamification.getLevel();
      
      if (!currentLevel) {
        throw new Error("User level not found");
      }

      const newTotalXP = currentLevel.total_xp + xpAmount;
      let newLevel = currentLevel.current_level;
      let newTitle = currentLevel.level_title;
      let remainingXP = currentLevel.current_xp + xpAmount;

      for (const config of LEVEL_CONFIG) {
        if (newTotalXP >= config.xp_required) {
          newLevel = config.level;
          newTitle = config.title;
          remainingXP = newTotalXP - config.xp_required;
        }
      }

      // Note: XP update should be done via a dedicated API endpoint
      // For now, return what would happen
      return { 
        data: { ...currentLevel, current_level: newLevel, level_title: newTitle, total_xp: newTotalXP, current_xp: remainingXP }, 
        leveledUp: newLevel > currentLevel.current_level 
      };
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
      const { challenges } = await api.public.challenges();
      return challenges;
    },
  });
};

export const useUserChallenges = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user-challenges", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { challenges } = await api.gamification.getChallenges();
      return challenges;
    },
    enabled: !!user,
  });
};

export const useJoinChallenge = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (_challengeId: string) => {
      // This would need a dedicated API endpoint
      throw new Error("Join challenge not implemented via API yet");
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
      const { spin, hasSpun } = await api.gamification.getTodaySpin();
      return hasSpun && spin ? [spin] : [];
    },
    enabled: !!user,
  });
};

export const useRecordSpin = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ prizeType, prizeValue }: { prizeType: string; prizeValue: number }) => {
      const { spin } = await api.gamification.spin(prizeType, prizeValue);
      return spin;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["today-spins", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["wallet", user?.id] });
    },
  });
};
