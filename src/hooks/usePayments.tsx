import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useUserDeposits = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user_deposits", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("pending_deposits")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useUserWithdrawals = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user_withdrawals", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("pending_withdrawals")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useCreateDeposit = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      amount,
      phoneNumber,
      mpesaCode,
      paymentNumberUsed,
    }: {
      amount: number;
      phoneNumber: string;
      mpesaCode?: string;
      paymentNumberUsed: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("pending_deposits")
        .insert({
          user_id: user.id,
          amount,
          phone_number: phoneNumber,
          mpesa_code: mpesaCode,
          payment_number_used: paymentNumberUsed,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_deposits", user?.id] });
    },
  });
};

export const useCreateWithdrawal = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      amount,
      phoneNumber,
    }: {
      amount: number;
      phoneNumber: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // First deduct from wallet
      const { data: wallet, error: walletError } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (walletError) throw walletError;

      if (Number(wallet.balance) < amount) {
        throw new Error("Insufficient balance");
      }

      await supabase
        .from("wallets")
        .update({ balance: Number(wallet.balance) - amount })
        .eq("user_id", user.id);

      const { data, error } = await supabase
        .from("pending_withdrawals")
        .insert({
          user_id: user.id,
          amount,
          phone_number: phoneNumber,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_withdrawals", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["wallet", user?.id] });
    },
  });
};
