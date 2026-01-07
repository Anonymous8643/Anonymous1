import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useIsAdmin = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["isAdmin", user?.id],
    queryFn: async () => {
      if (!user) return false;

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (error) return false;
      return !!data;
    },
    enabled: !!user,
  });
};

export const usePaymentNumbers = () => {
  return useQuery({
    queryKey: ["payment_numbers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_numbers")
        .select("*")
        .eq("is_active", true)
        .order("priority", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
};

export const useCurrentPaymentNumber = () => {
  const { data: numbers } = usePaymentNumbers();
  
  if (!numbers || numbers.length === 0) return null;
  
  // Rotate based on current hour for daily rotation
  const today = new Date();
  const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const index = dayOfYear % numbers.length;
  
  return numbers[index];
};

export const usePendingDeposits = () => {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["pending_deposits_admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pending_deposits")
        .select("*, profiles:user_id(full_name, email, phone)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });
};

export const usePendingWithdrawals = () => {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["pending_withdrawals_admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pending_withdrawals")
        .select("*, profiles:user_id(full_name, email, phone)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });
};

export const useApproveDeposit = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ depositId, approve }: { depositId: string; approve: boolean }) => {
      if (!user) throw new Error("Not authenticated");

      // Get the deposit details
      const { data: deposit, error: fetchError } = await supabase
        .from("pending_deposits")
        .select("*")
        .eq("id", depositId)
        .single();

      if (fetchError) throw fetchError;

      // Update deposit status
      const { error: updateError } = await supabase
        .from("pending_deposits")
        .update({
          status: approve ? "approved" : "rejected",
          approved_by: user.id,
          approved_at: new Date().toISOString(),
        })
        .eq("id", depositId);

      if (updateError) throw updateError;

      if (approve) {
        // Update user wallet
        const { data: wallet, error: walletError } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", deposit.user_id)
          .single();

        if (walletError) throw walletError;

        await supabase
          .from("wallets")
          .update({
            balance: Number(wallet.balance) + Number(deposit.amount),
          })
          .eq("user_id", deposit.user_id);

        // Create transaction record
        await supabase.from("transactions").insert({
          user_id: deposit.user_id,
          type: "deposit",
          amount: deposit.amount,
          description: `M-PESA Deposit - ${deposit.mpesa_code || "Manual"}`,
          status: "completed",
        });
      }

      // Log admin action
      await supabase.from("admin_audit_log").insert({
        admin_id: user.id,
        action: approve ? "approve_deposit" : "reject_deposit",
        target_table: "pending_deposits",
        target_id: depositId,
        details: { amount: deposit.amount, user_id: deposit.user_id },
      });

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending_deposits_admin"] });
    },
  });
};

export const useProcessWithdrawal = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ withdrawalId, approve }: { withdrawalId: string; approve: boolean }) => {
      if (!user) throw new Error("Not authenticated");

      const { data: withdrawal, error: fetchError } = await supabase
        .from("pending_withdrawals")
        .select("*")
        .eq("id", withdrawalId)
        .single();

      if (fetchError) throw fetchError;

      const { error: updateError } = await supabase
        .from("pending_withdrawals")
        .update({
          status: approve ? "completed" : "rejected",
          processed_by: user.id,
          processed_at: new Date().toISOString(),
        })
        .eq("id", withdrawalId);

      if (updateError) throw updateError;

      if (approve) {
        // Create transaction record
        await supabase.from("transactions").insert({
          user_id: withdrawal.user_id,
          type: "withdrawal",
          amount: -withdrawal.amount,
          description: `Withdrawal to ${withdrawal.phone_number}`,
          status: "completed",
        });
      } else {
        // Refund to wallet
        const { data: wallet } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", withdrawal.user_id)
          .single();

        if (wallet) {
          await supabase
            .from("wallets")
            .update({
              balance: Number(wallet.balance) + Number(withdrawal.amount),
            })
            .eq("user_id", withdrawal.user_id);
        }
      }

      await supabase.from("admin_audit_log").insert({
        admin_id: user.id,
        action: approve ? "approve_withdrawal" : "reject_withdrawal",
        target_table: "pending_withdrawals",
        target_id: withdrawalId,
        details: { amount: withdrawal.amount, user_id: withdrawal.user_id },
      });

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending_withdrawals_admin"] });
    },
  });
};

export const useAllUsers = () => {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["all_users_admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, wallets(balance, total_invested, total_returns)")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });
};

export const useUpdateUserBalance = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ userId, amount, reason }: { userId: string; amount: number; reason: string }) => {
      if (!user) throw new Error("Not authenticated");

      const { data: wallet, error: walletError } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (walletError) throw walletError;

      const newBalance = Number(wallet.balance) + amount;

      await supabase
        .from("wallets")
        .update({ balance: newBalance })
        .eq("user_id", userId);

      await supabase.from("transactions").insert({
        user_id: userId,
        type: amount > 0 ? "deposit" : "withdrawal",
        amount: amount,
        description: `Admin adjustment: ${reason}`,
        status: "completed",
      });

      await supabase.from("admin_audit_log").insert({
        admin_id: user.id,
        action: "balance_adjustment",
        target_table: "wallets",
        target_id: wallet.id,
        details: { user_id: userId, amount, reason, new_balance: newBalance },
      });

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all_users_admin"] });
    },
  });
};

export const useAllPaymentNumbers = () => {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["all_payment_numbers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_numbers")
        .select("*")
        .order("priority", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });
};

export const useAddPaymentNumber = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ phone, name }: { phone: string; name: string }) => {
      const { error } = await supabase
        .from("payment_numbers")
        .insert({ phone_number: phone, account_name: name });

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all_payment_numbers"] });
      queryClient.invalidateQueries({ queryKey: ["payment_numbers"] });
    },
  });
};

export const useTogglePaymentNumber = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("payment_numbers")
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all_payment_numbers"] });
      queryClient.invalidateQueries({ queryKey: ["payment_numbers"] });
    },
  });
};

export const useRecentInvestments = () => {
  return useQuery({
    queryKey: ["recent_investments_public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investments")
        .select("amount, expected_return, created_at, products(name)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
};

export const usePlatformStats = () => {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["platform_stats"],
    queryFn: async () => {
      const [depositsRes, withdrawalsRes, usersRes, investmentsRes] = await Promise.all([
        supabase.from("pending_deposits").select("amount, status").eq("status", "approved"),
        supabase.from("pending_withdrawals").select("amount, status").eq("status", "completed"),
        supabase.from("profiles").select("id", { count: "exact" }),
        supabase.from("investments").select("amount").eq("status", "active"),
      ]);

      const totalDeposits = depositsRes.data?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
      const totalWithdrawals = withdrawalsRes.data?.reduce((sum, w) => sum + Number(w.amount), 0) || 0;
      const totalUsers = usersRes.count || 0;
      const activeInvestments = investmentsRes.data?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;

      return {
        totalDeposits,
        totalWithdrawals,
        totalUsers,
        activeInvestments,
        cashFlow: totalDeposits - totalWithdrawals,
      };
    },
    enabled: isAdmin,
  });
};
