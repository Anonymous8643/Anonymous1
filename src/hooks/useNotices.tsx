import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Notice {
  id: string;
  title: string;
  message: string;
  type: "info" | "important" | "update";
  is_active: boolean | null;
  created_at: string;
  expires_at: string | null;
}

export const useNotices = () => {
  return useQuery({
    queryKey: ["notices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notices")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Notice[];
    },
  });
};
