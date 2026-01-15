import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, AdminDeposit, AdminWithdrawal, AdminUser, PaymentNumber, EmergencyMessage, MarketNews, Notice, PlatformStats, SuspiciousActivity, Product } from "@/lib/api";
import { useAuth } from "./useAuth";
import { supabase } from "@/integrations/supabase/client";

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
      const { numbers } = await api.public.paymentNumbers();
      return numbers;
    },
  });
};

export const useCurrentPaymentNumber = () => {
  const { data: numbers } = usePaymentNumbers();
  
  if (!numbers || numbers.length === 0) return null;
  
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
      const { deposits } = await api.admin.getAllDeposits();
      return deposits;
    },
    enabled: isAdmin,
  });
};

export const usePendingWithdrawals = () => {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["pending_withdrawals_admin"],
    queryFn: async () => {
      const { withdrawals } = await api.admin.getAllWithdrawals();
      return withdrawals;
    },
    enabled: isAdmin,
  });
};

export const useApproveDeposit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ depositId, approve, adminNotes }: { depositId: string; approve: boolean; adminNotes?: string }) => {
      await api.admin.approveDeposit(depositId, approve, adminNotes);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending_deposits_admin"] });
      queryClient.invalidateQueries({ queryKey: ["platform_stats"] });
    },
  });
};

export const useProcessWithdrawal = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ withdrawalId, approve, adminNotes }: { withdrawalId: string; approve: boolean; adminNotes?: string }) => {
      await api.admin.processWithdrawal(withdrawalId, approve, adminNotes);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending_withdrawals_admin"] });
      queryClient.invalidateQueries({ queryKey: ["platform_stats"] });
    },
  });
};

export const useAllUsers = () => {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["all_users_admin"],
    queryFn: async () => {
      const { users } = await api.admin.getAllUsers();
      return users;
    },
    enabled: isAdmin,
  });
};

export const useUpdateUserBalance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId, amount, reason }: { userId: string; amount: number; reason: string }) => {
      await api.admin.updateUserBalance(userId, amount, reason);
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
      const { numbers } = await api.admin.getPaymentNumbers();
      return numbers;
    },
    enabled: isAdmin,
  });
};

export const useAddPaymentNumber = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ phone, name }: { phone: string; name: string }) => {
      await api.admin.addPaymentNumber(phone, name);
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
      await api.admin.togglePaymentNumber(id, isActive);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all_payment_numbers"] });
      queryClient.invalidateQueries({ queryKey: ["payment_numbers"] });
    },
  });
};

export const useDeletePaymentNumber = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      await api.admin.deletePaymentNumber(id);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all_payment_numbers"] });
      queryClient.invalidateQueries({ queryKey: ["payment_numbers"] });
    },
  });
};

export const usePlatformStats = () => {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["platform_stats"],
    queryFn: async () => {
      const { stats } = await api.admin.getStats();
      return stats;
    },
    enabled: isAdmin,
  });
};

// Market News hooks
export const useAllMarketNews = () => {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["all_market_news"],
    queryFn: async () => {
      const { news } = await api.admin.getMarketNews();
      return news;
    },
    enabled: isAdmin,
  });
};

export const useCreateMarketNews = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, description, imageUrl }: { title: string; description: string; imageUrl?: string }) => {
      await api.admin.createMarketNews(title, description, imageUrl);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all_market_news"] });
    },
  });
};

export const useToggleMarketNews = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await api.admin.toggleMarketNews(id, isActive);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all_market_news"] });
    },
  });
};

export const useDeleteMarketNews = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      await api.admin.deleteMarketNews(id);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all_market_news"] });
    },
  });
};

// Notices hooks
export const useAllNotices = () => {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["all_notices"],
    queryFn: async () => {
      const { notices } = await api.admin.getNotices();
      return notices;
    },
    enabled: isAdmin,
  });
};

export const useCreateNotice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ title, message, type, expiresAt }: { title: string; message: string; type?: string; expiresAt?: string }) => {
      await api.admin.createNotice(title, message, type, expiresAt);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all_notices"] });
    },
  });
};

export const useToggleNotice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await api.admin.toggleNotice(id, isActive);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all_notices"] });
    },
  });
};

export const useDeleteNotice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      await api.admin.deleteNotice(id);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all_notices"] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      await api.admin.deleteUser(userId);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all_users_admin"] });
    },
  });
};

// Platform Settings hooks
export interface PlatformSetting {
  id: string;
  key: string;
  value: Record<string, unknown>;
  updated_at: string;
  updated_by: string | null;
}

export const usePlatformSettings = () => {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["platform_settings_admin"],
    queryFn: async () => {
      const { settings } = await api.admin.getPlatformSettings();
      return settings as PlatformSetting[];
    },
    enabled: isAdmin,
  });
};

export const useUpdatePlatformSetting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Record<string, unknown> }) => {
      await api.admin.updatePlatformSetting(key, value);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform_settings_admin"] });
      queryClient.invalidateQueries({ queryKey: ["platform_settings_public"] });
    },
  });
};

// Public platform settings (for checking freeze status)
export const usePublicPlatformSettings = () => {
  return useQuery({
    queryKey: ["platform_settings_public"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("platform_settings")
        .select("*");
      if (error) throw error;
      return data as PlatformSetting[];
    },
  });
};

// Upload image hook
export const useUploadImage = () => {
  return useMutation({
    mutationFn: async ({ file, bucket }: { file: File; bucket: string }) => {
      // Get signed upload URL
      const { signedUrl, path } = await api.admin.uploadImage(bucket, file.name, file.type);
      
      // Upload file directly to storage
      const uploadRes = await fetch(signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });
      
      if (!uploadRes.ok) throw new Error('Upload failed');
      
      // Get public URL
      const { publicUrl } = await api.admin.getImageUrl(bucket, path);
      return { publicUrl, path };
    },
  });
};

// Public hook for live activity - no auth required
export const useRecentInvestments = () => {
  return useQuery({
    queryKey: ["recent_investments_public"],
    queryFn: async () => {
      const { investments } = await api.investments.recent();
      return investments;
    },
    refetchInterval: 30000,
    staleTime: 10000,
  });
};

// Reset all data hook
export const useResetAllData = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await api.admin.resetAllData();
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform_stats"] });
      queryClient.invalidateQueries({ queryKey: ["pending_deposits_admin"] });
      queryClient.invalidateQueries({ queryKey: ["pending_withdrawals_admin"] });
      queryClient.invalidateQueries({ queryKey: ["all_users_admin"] });
    },
  });
};

// Suspicious activities hooks
export const useSuspiciousActivities = () => {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["suspicious_activities_admin"],
    queryFn: async () => {
      const { activities } = await api.admin.getSuspiciousActivities();
      return activities;
    },
    enabled: isAdmin,
    refetchInterval: 30000,
  });
};

export const useResolveSuspiciousActivity = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      await api.admin.resolveSuspiciousActivity(id);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suspicious_activities_admin"] });
    },
  });
};

// Admin Products hooks
export const useAllProducts = () => {
  const { data: isAdmin } = useIsAdmin();

  return useQuery({
    queryKey: ["all_products_admin"],
    queryFn: async () => {
      const { products } = await api.admin.getAllProducts();
      return products;
    },
    enabled: isAdmin,
  });
};

export const useToggleProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await api.admin.toggleProduct(id, isActive);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all_products_admin"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};
