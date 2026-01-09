import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, Profile } from "@/lib/api";
import { useAuth } from "./useAuth";

export type { Profile };

export const useProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { profile } = await api.profile.get();
      return profile;
    },
    enabled: !!user,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user) throw new Error("Not authenticated");
      const { profile } = await api.profile.update(updates);
      return profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });
};

export const useToggleHideBalance = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (hideBalance: boolean) => {
      if (!user) throw new Error("Not authenticated");
      const { profile } = await api.profile.update({ hide_balance: hideBalance });
      return profile;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", user?.id] });
    },
  });
};
