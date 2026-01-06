import { motion } from "framer-motion";
import { Flame, Award, Zap, Gift, Trophy, ChevronRight } from "lucide-react";
import { BottomNav } from "@/components/ui/BottomNav";
import { StreakCalendar } from "@/components/gamification/StreakCalendar";
import { AchievementBadges } from "@/components/gamification/AchievementBadges";
import { LevelProgress } from "@/components/gamification/LevelProgress";
import { SpinWheel } from "@/components/gamification/SpinWheel";
import { WeeklyChallenges } from "@/components/gamification/WeeklyChallenges";
import { useUserStreak, useUserLevel, useUserAchievements } from "@/hooks/useGamification";
import { Skeleton } from "@/components/ui/skeleton";
import logo from "@/assets/logo.png";
import { Link } from "react-router-dom";

export default function Rewards() {
  const { data: streak, isLoading: streakLoading } = useUserStreak();
  const { data: level, isLoading: levelLoading } = useUserLevel();
  const { data: achievements, isLoading: achievementsLoading } = useUserAchievements();

  const isLoading = streakLoading || levelLoading || achievementsLoading;

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="px-4 py-4 max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <img src={logo} alt="InvesterMate" className="w-10 h-10" />
              <div>
                <h1 className="text-xl font-display font-bold">Rewards</h1>
                <p className="text-muted-foreground text-sm">Earn while you invest</p>
              </div>
            </div>
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              <ChevronRight className="w-5 h-5 rotate-180" />
            </Link>
          </motion.div>
        </div>
      </header>

      {/* Stats Summary */}
      <div className="px-4 py-4 max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-4 gap-3 mb-6"
        >
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))
          ) : (
            <>
              <div className="glass-card p-3 text-center">
                <Flame className="w-5 h-5 mx-auto mb-1 text-orange-500" />
                <p className="text-lg font-bold">{streak?.current_streak || 0}</p>
                <p className="text-[10px] text-muted-foreground">Day Streak</p>
              </div>
              <div className="glass-card p-3 text-center">
                <Award className="w-5 h-5 mx-auto mb-1 text-amber-500" />
                <p className="text-lg font-bold">{achievements?.length || 0}</p>
                <p className="text-[10px] text-muted-foreground">Badges</p>
              </div>
              <div className="glass-card p-3 text-center">
                <Zap className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-lg font-bold">{level?.total_xp || 0}</p>
                <p className="text-[10px] text-muted-foreground">Total XP</p>
              </div>
              <div className="glass-card p-3 text-center">
                <Trophy className="w-5 h-5 mx-auto mb-1 text-purple-500" />
                <p className="text-lg font-bold">Lv.{level?.current_level || 1}</p>
                <p className="text-[10px] text-muted-foreground">Level</p>
              </div>
            </>
          )}
        </motion.div>
      </div>

      {/* Main Content */}
      <main className="px-4 max-w-lg mx-auto space-y-6">
        {/* Level Progress */}
        <LevelProgress />

        {/* Daily Streak */}
        <StreakCalendar />

        {/* Spin Wheel */}
        <SpinWheel />

        {/* Weekly Challenges */}
        <WeeklyChallenges />

        {/* Achievement Badges */}
        <AchievementBadges />
      </main>

      <BottomNav />
    </div>
  );
}
