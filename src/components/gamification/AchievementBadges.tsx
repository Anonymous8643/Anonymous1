import { motion } from "framer-motion";
import { 
  Award, Crown, Gem, Diamond, Users, Flame, Zap, Star, PieChart, Rocket, 
  TrendingUp, Lock 
} from "lucide-react";
import { useAchievements, useUserAchievements } from "@/hooks/useGamification";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  "trending-up": TrendingUp,
  crown: Crown,
  gem: Gem,
  diamond: Diamond,
  users: Users,
  flame: Flame,
  zap: Zap,
  star: Star,
  "pie-chart": PieChart,
  rocket: Rocket,
  award: Award,
};

const tierColors: Record<string, { bg: string; border: string; glow: string }> = {
  bronze: { 
    bg: "from-amber-700 to-amber-900", 
    border: "border-amber-600",
    glow: "shadow-amber-500/30"
  },
  silver: { 
    bg: "from-gray-300 to-gray-500", 
    border: "border-gray-400",
    glow: "shadow-gray-400/30"
  },
  gold: { 
    bg: "from-yellow-400 to-amber-500", 
    border: "border-yellow-400",
    glow: "shadow-yellow-400/30"
  },
  platinum: { 
    bg: "from-cyan-300 to-cyan-500", 
    border: "border-cyan-400",
    glow: "shadow-cyan-400/30"
  },
  diamond: { 
    bg: "from-purple-400 via-pink-400 to-purple-500", 
    border: "border-purple-400",
    glow: "shadow-purple-400/30"
  },
};

interface AchievementBadgesProps {
  showAll?: boolean;
}

export const AchievementBadges = ({ showAll = false }: AchievementBadgesProps) => {
  const { data: achievements, isLoading: achievementsLoading } = useAchievements();
  const { data: userAchievements, isLoading: userLoading } = useUserAchievements();

  const isLoading = achievementsLoading || userLoading;

  const earnedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);

  const displayAchievements = showAll 
    ? achievements 
    : achievements?.slice(0, 6);

  if (isLoading) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-6 w-32 bg-muted rounded mb-4" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <div className="w-16 h-16 rounded-full bg-muted" />
              <div className="w-16 h-3 bg-muted rounded" />
            </div>
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
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-600 flex items-center justify-center">
            <Award className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg">Achievements</h3>
            <p className="text-muted-foreground text-sm">
              {userAchievements?.length || 0} of {achievements?.length || 0} earned
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {displayAchievements?.map((achievement, index) => {
          const Icon = iconMap[achievement.icon] || Award;
          const isEarned = earnedIds.has(achievement.id);
          const colors = tierColors[achievement.tier];

          return (
            <motion.div
              key={achievement.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05 }}
              className="flex flex-col items-center gap-2 text-center"
            >
              <div
                className={`
                  relative w-16 h-16 rounded-full flex items-center justify-center
                  transition-all duration-300
                  ${isEarned 
                    ? `bg-gradient-to-br ${colors.bg} ${colors.border} border-2 shadow-lg ${colors.glow}` 
                    : "bg-muted/50 border border-border"
                  }
                `}
              >
                {isEarned ? (
                  <Icon className="w-7 h-7 text-white drop-shadow-md" />
                ) : (
                  <Lock className="w-5 h-5 text-muted-foreground" />
                )}

                {/* Tier badge */}
                {isEarned && (
                  <div className="absolute -bottom-1 px-2 py-0.5 rounded-full bg-background border border-border text-[10px] font-medium capitalize">
                    {achievement.tier}
                  </div>
                )}
              </div>

              <div>
                <p className={`text-xs font-medium ${isEarned ? "text-foreground" : "text-muted-foreground"}`}>
                  {achievement.title}
                </p>
                {isEarned && (
                  <p className="text-[10px] text-primary">+KES {achievement.reward_amount}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {!showAll && achievements && achievements.length > 6 && (
        <button className="w-full mt-4 text-sm text-primary hover:underline">
          View all achievements →
        </button>
      )}
    </motion.div>
  );
};
