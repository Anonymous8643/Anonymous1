import { motion } from "framer-motion";
import { Check, Flame, Gift, Lock } from "lucide-react";
import { useUserStreak, useClaimedStreakRewards, STREAK_REWARDS } from "@/hooks/useGamification";

export const StreakCalendar = () => {
  const { data: streak, isLoading: streakLoading } = useUserStreak();
  const { data: claimedRewards, isLoading: claimedLoading } = useClaimedStreakRewards();

  const isLoading = streakLoading || claimedLoading;

  const currentStreak = streak?.current_streak || 0;
  const days = Array.from({ length: 30 }, (_, i) => i + 1);

  // Check which rewards have been permanently claimed
  const claimedDays = new Set(claimedRewards?.map(r => r.streak_day) || []);

  const getMilestoneReward = (day: number) => STREAK_REWARDS[day] || 0;

  const getDayStatus = (day: number) => {
    // If this reward day was already claimed, show as completed regardless of current streak
    if (claimedDays.has(day)) return "claimed";
    if (day <= currentStreak) return "completed";
    if (day === currentStreak + 1) return "current";
    return "locked";
  };

  if (isLoading) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-6 w-40 bg-muted rounded mb-4" />
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg">Daily Streak</h3>
            <p className="text-muted-foreground text-sm">
              {currentStreak} day{currentStreak !== 1 ? "s" : ""} streak!
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold gradient-text">{currentStreak}</p>
          <p className="text-xs text-muted-foreground">Current</p>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2 mb-4">
        {days.map((day) => {
          const status = getDayStatus(day);
          const reward = getMilestoneReward(day);
          const isMilestone = reward > 0;

          return (
            <motion.div
              key={day}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: day * 0.02 }}
              className={`
                relative aspect-square rounded-lg flex items-center justify-center text-xs font-medium
                transition-all duration-300
                ${status === "claimed" 
                  ? "bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/20" 
                  : status === "completed" 
                  ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20" 
                  : status === "current"
                  ? "bg-primary/20 border-2 border-primary border-dashed text-primary"
                  : "bg-muted/50 text-muted-foreground"
                }
                ${isMilestone && status !== "claimed" ? "ring-2 ring-amber-500/50" : ""}
              `}
            >
              {status === "claimed" ? (
                <Gift className="w-4 h-4" />
              ) : status === "completed" ? (
                <Check className="w-4 h-4" />
              ) : status === "locked" ? (
                <span className="opacity-50">{day}</span>
              ) : (
                <span>{day}</span>
              )}

              {/* Milestone indicator - only show if not yet claimed */}
              {isMilestone && status !== "claimed" && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                  <Gift className="w-2.5 h-2.5 text-amber-950" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Milestone Rewards */}
      <div className="flex items-center justify-between pt-4 border-t border-border">
        {Object.entries(STREAK_REWARDS).slice(0, 5).map(([day, reward]) => {
          const dayNum = Number(day);
          const isClaimed = claimedDays.has(dayNum);
          const isReached = dayNum <= currentStreak;
          
          return (
            <div
              key={day}
              className={`
                flex flex-col items-center gap-1 text-center
                ${isClaimed ? "text-amber-500" : isReached ? "text-primary" : "text-muted-foreground"}
              `}
            >
              <div
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                  ${isClaimed 
                    ? "bg-amber-500 text-white" 
                    : isReached 
                    ? "bg-primary text-primary-foreground" 
                    : "bg-muted"
                  }
                `}
              >
                {isClaimed ? <Gift className="w-4 h-4" /> : isReached ? <Check className="w-4 h-4" /> : day}
              </div>
              <span className="text-[10px] font-medium">
                {isClaimed ? "Claimed" : `KES ${reward}`}
              </span>
            </div>
          );
        })}
      </div>

      {/* Longest Streak */}
      <div className="mt-4 pt-4 border-t border-border flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Longest streak</span>
        <span className="font-bold">{streak?.longest_streak || 0} days</span>
      </div>
    </motion.div>
  );
};
