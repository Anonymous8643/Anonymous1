import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useProfile } from "./useProfile";

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  reward_amount: number | null;
  status: string;
  created_at: string;
  referred_profile?: {
    full_name: string | null;
    email: string | null;
    created_at: string;
  };
}

export const useReferrals = () => {
  const { user } = useAuth();
  const { data: profile } = useProfile();

  return useQuery({
    queryKey: ["referrals", profile?.id],
    queryFn: async () => {
      if (!profile) return [];

      const { data, error } = await supabase
        .from("referrals")
        .select(`
          *,
          referred_profile:profiles!referrals_referred_id_fkey(full_name, email, created_at)
        `)
        .eq("referrer_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Referral[];
    },
    enabled: !!profile,
  });
};

export const useReferralStats = () => {
  const { data: referrals, isLoading } = useReferrals();

  const stats = {
    totalReferrals: referrals?.length || 0,
    completedReferrals: referrals?.filter((r) => r.status === "completed" || r.status === "rewarded").length || 0,
    totalRewards: referrals?.reduce((sum, r) => sum + (r.reward_amount || 0), 0) || 0,
    pendingReferrals: referrals?.filter((r) => r.status === "pending").length || 0,
  };

  return { stats, isLoading };
};
