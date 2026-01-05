import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  total_invested: number;
  total_returns: number;
  pending_returns: number;
  created_at: string;
  updated_at: string;
}

export const useWallet = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as Wallet | null;
    },
    enabled: !!user,
  });
};

export const useUpdateWallet = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<Wallet>) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("wallets")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wallet", user?.id] });
    },
  });
};
