import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface AdminMessage {
  id: string;
  user_id: string;
  admin_id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

// Hook for users to get their messages
export const useUserMessages = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["user-messages", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("admin_user_messages")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AdminMessage[];
    },
    enabled: !!user?.id,
  });
};

// Hook for users to get unread message count
export const useUnreadMessageCount = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["unread-messages-count", user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      const { count, error } = await supabase
        .from("admin_user_messages")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!user?.id,
  });
};

// Hook to mark message as read
export const useMarkMessageRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from("admin_user_messages")
        .update({ is_read: true })
        .eq("id", messageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-messages"] });
      queryClient.invalidateQueries({ queryKey: ["unread-messages-count"] });
    },
  });
};

// Admin hooks
export const useAllUserMessages = () => {
  return useQuery({
    queryKey: ["all-user-messages"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_user_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as AdminMessage[];
    },
  });
};

export const useSendUserMessage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async ({ 
      userId, 
      title, 
      message, 
      type 
    }: { 
      userId: string; 
      title: string; 
      message: string; 
      type: string;
    }) => {
      if (!user?.id) throw new Error("Not authenticated");
      const { error } = await supabase
        .from("admin_user_messages")
        .insert({
          user_id: userId,
          admin_id: user.id,
          title,
          message,
          type,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-user-messages"] });
    },
  });
};

export const useDeleteUserMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (messageId: string) => {
      const { error } = await supabase
        .from("admin_user_messages")
        .delete()
        .eq("id", messageId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all-user-messages"] });
    },
  });
};
