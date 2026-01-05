import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Investment {
  id: string;
  user_id: string;
  product_id: string;
  amount: number;
  expected_return: number;
  purchased_at: string;
  matures_at: string;
  status: string;
  created_at: string;
  product?: {
    name: string;
    image_url: string | null;
    category: string;
    duration_days: number;
  };
}

export const useInvestments = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["investments", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("investments")
        .select(`
          *,
          product:products(name, image_url, category, duration_days)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Investment[];
    },
    enabled: !!user,
  });
};

export const useCreateInvestment = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      productId,
      amount,
      expectedReturn,
      durationDays,
    }: {
      productId: string;
      amount: number;
      expectedReturn: number;
      durationDays: number;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const maturesAt = new Date();
      maturesAt.setDate(maturesAt.getDate() + durationDays);

      const { data, error } = await supabase
        .from("investments")
        .insert({
          user_id: user.id,
          product_id: productId,
          amount,
          expected_return: expectedReturn,
          matures_at: maturesAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investments", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["wallet", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};
