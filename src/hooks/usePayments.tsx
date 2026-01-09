import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Deposit, Withdrawal } from "@/lib/api";
import { useAuth } from "./useAuth";

export type { Deposit, Withdrawal };

export const useUserDeposits = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["user_deposits", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { deposits } = await api.deposits.list();
      return deposits;
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
      const { withdrawals } = await api.withdrawals.list();
      return withdrawals;
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
      const { deposit } = await api.deposits.create({
        amount,
        phoneNumber,
        mpesaCode,
        paymentNumberUsed,
      });
      return deposit;
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
      const { withdrawal } = await api.withdrawals.create({ amount, phoneNumber });
      return withdrawal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user_withdrawals", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["wallet", user?.id] });
    },
  });
};
