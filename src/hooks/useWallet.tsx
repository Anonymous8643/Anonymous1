import { useQuery } from "@tanstack/react-query";
import { api, Wallet } from "@/lib/api";
import { useAuth } from "./useAuth";

export type { Wallet };

export const useWallet = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["wallet", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { wallet } = await api.wallet.get();
      return wallet;
    },
    enabled: !!user,
  });
};
