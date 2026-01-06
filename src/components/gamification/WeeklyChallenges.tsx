import { motion } from "framer-motion";
import { Target, Clock, Gift, CheckCircle2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useWeeklyChallenges, useUserChallenges, useJoinChallenge } from "@/hooks/useGamification";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";

export const WeeklyChallenges = () => {
  const { data: challenges, isLoading: challengesLoading } = useWeeklyChallenges();
  const { data: userChallenges, isLoading: userLoading } = useUserChallenges();
  const { mutateAsync: joinChallenge, isPending } = useJoinChallenge();
  const { toast } = useToast();

  const isLoading = challengesLoading || userLoading;

  const userChallengeMap = new Map(
    userChallenges?.map(uc => [uc.challenge_id, uc]) || []
  );

  const handleJoin = async (challengeId: string) => {
    try {
      await joinChallenge(challengeId);
      toast({
        title: "Challenge joined!",
        description: "Good luck completing this challenge!",
      });
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to join challenge",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card p-6 animate-pulse">
        <div className="h-6 w-40 bg-muted rounded mb-4" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 bg-muted rounded-lg" />
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg">Weekly Challenges</h3>
            <p className="text-muted-foreground text-sm">
              Complete for bonus rewards
            </p>
          </div>
        </div>
      </div>

      {/* Challenge List */}
      <div className="space-y-4">
        {challenges?.map((challenge, index) => {
          const userChallenge = userChallengeMap.get(challenge.id);
          const isJoined = !!userChallenge;
          const isCompleted = userChallenge?.completed;
          const progress = userChallenge?.current_progress || 0;
          const progressPercent = Math.min(100, (progress / challenge.target_value) * 100);
          const endsIn = formatDistanceToNow(new Date(challenge.ends_at), { addSuffix: false });

          return (
            <motion.div
              key={challenge.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                p-4 rounded-xl border transition-all
                ${isCompleted 
                  ? "bg-primary/10 border-primary/30" 
                  : "bg-muted/50 border-border hover:border-primary/30"
                }
              `}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold">{challenge.title}</h4>
                    {isCompleted && (
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{challenge.description}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  <span>{endsIn}</span>
                </div>
              </div>

              {/* Progress Bar */}
              {isJoined && (
                <div className="mb-3">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">
                      {progress.toLocaleString()} / {challenge.target_value.toLocaleString()}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progressPercent}%` }}
                      className="h-full rounded-full bg-gradient-to-r from-primary to-trust"
                    />
                  </div>
                </div>
              )}

              {/* Rewards & Action */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs">
                    <Gift className="w-3 h-3 text-amber-500" />
                    <span className="text-amber-500 font-medium">KES {challenge.reward_amount}</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>+{challenge.xp_reward} XP</span>
                  </div>
                </div>

                {!isJoined ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleJoin(challenge.id)}
                    disabled={isPending}
                    className="gap-1"
                  >
                    <Plus className="w-3 h-3" />
                    Join
                  </Button>
                ) : isCompleted ? (
                  <span className="text-xs font-medium text-primary">Completed!</span>
                ) : (
                  <span className="text-xs text-muted-foreground">In Progress</span>
                )}
              </div>
            </motion.div>
          );
        })}

        {(!challenges || challenges.length === 0) && (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No active challenges</p>
            <p className="text-sm">Check back soon!</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
