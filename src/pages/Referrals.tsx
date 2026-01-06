import { useState } from "react";
import { motion } from "framer-motion";
import { Share2, Gift, Users, Trophy, Copy, CheckCircle, MessageCircle, Crown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/ui/BottomNav";
import { useProfile } from "@/hooks/useProfile";
import { useReferrals, useReferralStats } from "@/hooks/useReferrals";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import logo from "@/assets/logo.png";
import { Link } from "react-router-dom";

const milestones = [
  { count: 5, badge: "Bronze Referrer", reward: 500, icon: "🥉" },
  { count: 10, badge: "Silver Referrer", reward: 1500, icon: "🥈" },
  { count: 25, badge: "Gold Referrer", reward: 5000, icon: "🥇" },
  { count: 50, badge: "Platinum Referrer", reward: 15000, icon: "💎" },
];

export default function Referrals() {
  const { toast } = useToast();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: referrals, isLoading: referralsLoading } = useReferrals();
  const { stats } = useReferralStats();
  const [copied, setCopied] = useState(false);

  const referralLink = `${window.location.origin}/auth?ref=${profile?.referral_code || ""}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast({ title: "Copied!", description: "Referral link copied to clipboard" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to copy link" });
    }
  };

  const shareViaWhatsApp = () => {
    const message = encodeURIComponent(`Join InvesterMate and start earning! Use my referral link: ${referralLink}`);
    window.open(`https://wa.me/?text=${message}`, "_blank");
  };

  const shareViaTelegram = () => {
    const message = encodeURIComponent(`Join InvesterMate and start earning! Use my referral link: ${referralLink}`);
    window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${message}`, "_blank");
  };

  // Calculate current milestone progress
  const currentMilestone = milestones.find((m) => stats.completedReferrals < m.count) || milestones[milestones.length - 1];
  const progress = (stats.completedReferrals / currentMilestone.count) * 100;

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
                <h1 className="text-xl font-display font-bold">Referrals</h1>
                <p className="text-sm text-muted-foreground">Invite friends & earn</p>
              </div>
            </div>
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              <ChevronRight className="w-5 h-5 rotate-180" />
            </Link>
          </motion.div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4 text-center"
          >
            <Users className="w-8 h-8 text-primary mx-auto mb-2" />
            <p className="text-2xl font-bold">{stats.totalReferrals}</p>
            <p className="text-xs text-muted-foreground">Total Referrals</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-4 text-center"
          >
            <Gift className="w-8 h-8 text-profit mx-auto mb-2" />
            <p className="text-2xl font-bold text-profit">KES {stats.totalRewards.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">Total Rewards</p>
          </motion.div>
        </div>

        {/* Referral Code */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Your Referral Code
          </h3>

          {profileLoading ? (
            <Skeleton className="h-12 w-full mb-4" />
          ) : (
            <div className="bg-muted/50 rounded-lg p-4 mb-4 flex items-center justify-between">
              <code className="text-lg font-mono font-bold tracking-wider">
                {profile?.referral_code || "Loading..."}
              </code>
              <Button variant="ghost" size="icon" onClick={copyToClipboard}>
                {copied ? (
                  <CheckCircle className="w-5 h-5 text-profit" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </Button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Button onClick={shareViaWhatsApp} className="gap-2 bg-[#25D366] hover:bg-[#25D366]/90">
              <MessageCircle className="w-4 h-4" />
              WhatsApp
            </Button>
            <Button onClick={shareViaTelegram} className="gap-2 bg-[#0088cc] hover:bg-[#0088cc]/90">
              <MessageCircle className="w-4 h-4" />
              Telegram
            </Button>
          </div>
        </motion.div>

        {/* Milestone Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-urgency" />
            Milestone Progress
          </h3>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progress to {currentMilestone.badge}</span>
              <span className="font-medium">{stats.completedReferrals}/{currentMilestone.count}</span>
            </div>
            <div className="progress-bar">
              <motion.div
                className="progress-fill"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ duration: 1 }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Earn KES {currentMilestone.reward.toLocaleString()} when you reach this milestone!
            </p>
          </div>

          {/* Milestone badges */}
          <div className="grid grid-cols-4 gap-2">
            {milestones.map((milestone) => (
              <div
                key={milestone.count}
                className={`text-center p-3 rounded-lg ${
                  stats.completedReferrals >= milestone.count
                    ? "bg-primary/20"
                    : "bg-muted/30"
                }`}
              >
                <span className="text-2xl">{milestone.icon}</span>
                <p className="text-xs mt-1">{milestone.count}+</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Referral History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-card p-6"
        >
          <h3 className="font-semibold mb-4">Recent Referrals</h3>

          {referralsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : referrals && referrals.length > 0 ? (
            <div className="space-y-3">
              {referrals.slice(0, 5).map((referral, index) => (
                <motion.div
                  key={referral.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                      {referral.referred_profile?.full_name?.[0] || "?"}
                    </div>
                    <div>
                      <p className="font-medium">
                        {referral.referred_profile?.full_name || referral.referred_profile?.email || "Anonymous"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(referral.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      referral.status === "rewarded" 
                        ? "bg-profit/20 text-profit" 
                        : referral.status === "completed"
                        ? "bg-trust/20 text-trust"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {referral.status}
                    </span>
                    {referral.reward_amount && referral.reward_amount > 0 && (
                      <p className="text-sm text-profit mt-1">+KES {referral.reward_amount}</p>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No referrals yet</p>
              <p className="text-sm">Share your code to start earning!</p>
            </div>
          )}
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}
