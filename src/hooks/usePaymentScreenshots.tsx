import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "./useAdmin";

export interface PaymentScreenshot {
  id: string;
  image_url: string;
  caption: string | null;
  is_active: boolean;
  created_at: string;
  created_by: string;
  display_order: number;
}

// Public hook - fetches active screenshots
export const usePaymentScreenshots = () => {
  return useQuery({
    queryKey: ["payment_screenshots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_screenshots")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as PaymentScreenshot[];
    },
  });
};

// Admin hook - fetches all screenshots
export const useAllPaymentScreenshots = () => {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["all_payment_screenshots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_screenshots")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as PaymentScreenshot[];
    },
    enabled: isAdmin,
  });
};

// Admin mutation - add screenshot
export const useAddPaymentScreenshot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ imageUrl, caption }: { imageUrl: string; caption?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("payment_screenshots")
        .insert({
          image_url: imageUrl,
          caption: caption || null,
          created_by: user.id,
        });
      
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all_payment_screenshots"] });
      queryClient.invalidateQueries({ queryKey: ["payment_screenshots"] });
    },
  });
};

// Admin mutation - toggle screenshot visibility
export const useTogglePaymentScreenshot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("payment_screenshots")
        .update({ is_active: isActive })
        .eq("id", id);
      
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all_payment_screenshots"] });
      queryClient.invalidateQueries({ queryKey: ["payment_screenshots"] });
    },
  });
};

// Admin mutation - delete screenshot
export const useDeletePaymentScreenshot = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase
        .from("payment_screenshots")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all_payment_screenshots"] });
      queryClient.invalidateQueries({ queryKey: ["payment_screenshots"] });
    },
  });
};

// Admin mutation - upload screenshot image
export const useUploadPaymentScreenshot = () => {
  return useMutation({
    mutationFn: async ({ file }: { file: File }) => {
      const fileName = `${Date.now()}-${file.name}`;
      const { data, error } = await supabase.storage
        .from("payment-screenshots")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
        });
      
      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("payment-screenshots")
        .getPublicUrl(data.path);

      return { publicUrl: urlData.publicUrl, path: data.path };
    },
  });
};
