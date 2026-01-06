import { motion } from "framer-motion";
import { Sparkles, ChevronRight, Zap } from "lucide-react";
import { useUserLevel, LEVEL_CONFIG } from "@/hooks/useGamification";

export const LevelProgress = () => {
  const { data: userLevel, isLoading } = useUserLevel();

  const currentLevel = userLevel?.current_level || 1;
  const currentXP = userLevel?.current_xp || 0;
  const totalXP = userLevel?.total_xp || 0;
  const levelTitle = userLevel?.level_title || "Beginner";

  const currentConfig = LEVEL_CONFIG.find(c => c.level === currentLevel) || LEVEL_CONFIG[0];
  const nextConfig = LEVEL_CONFIG.find(c => c.level === currentLevel + 1);

  const xpToNextLevel = nextConfig 
    ? nextConfig.xp_required - currentConfig.xp_required 
    : 0;
  const xpProgress = nextConfig 
    ? Math.min(100, (currentXP / xpToNextLevel) * 100) 
    : 100;

  if (isLoading) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-muted" />
          <div className="flex-1">
            <div className="h-5 w-24 bg-muted rounded mb-2" />
            <div className="h-3 w-full bg-muted rounded" />
          </div>
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
      <div className="flex items-center gap-4">
        {/* Level Badge */}
        <div className="relative">
          <motion.div
            animate={{ 
              boxShadow: [
                "0 0 0 0 rgba(45, 212, 191, 0)",
                "0 0 0 8px rgba(45, 212, 191, 0.1)",
                "0 0 0 0 rgba(45, 212, 191, 0)"
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-trust flex items-center justify-center"
          >
            <span className="text-2xl font-bold text-primary-foreground">{currentLevel}</span>
          </motion.div>
          <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5 text-amber-950" />
          </div>
        </div>

        {/* Level Info */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <h3 className="font-display font-bold text-lg">{levelTitle}</h3>
            {nextConfig && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span>Next: {nextConfig.title}</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            )}
          </div>

          {/* XP Progress Bar */}
          <div className="relative h-3 rounded-full bg-muted overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${xpProgress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                background: "linear-gradient(90deg, hsl(var(--primary)), hsl(var(--trust)))"
              }}
            />
          </div>

          <div className="flex items-center justify-between mt-2 text-xs">
            <div className="flex items-center gap-1 text-primary">
              <Zap className="w-3 h-3" />
              <span className="font-medium">{totalXP} XP total</span>
            </div>
            {nextConfig && (
              <span className="text-muted-foreground">
                {currentXP} / {xpToNextLevel} to next level
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Current Level Benefits */}
      {currentConfig.benefits.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">Your benefits:</p>
          <div className="flex flex-wrap gap-2">
            {currentConfig.benefits.map((benefit, i) => (
              <span
                key={i}
                className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
              >
                {benefit}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Next Level Preview */}
      {nextConfig && nextConfig.benefits.length > 0 && (
        <div className="mt-3 p-3 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground mb-1">
            Unlock at Level {nextConfig.level}:
          </p>
          <p className="text-sm font-medium text-foreground">
            {nextConfig.benefits[0]}
          </p>
        </div>
      )}
    </motion.div>
  );
};
