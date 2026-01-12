import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, EmergencyMessage } from "@/lib/api";

export type { EmergencyMessage };

export const useEmergencyMessages = () => {
  return useQuery({
    queryKey: ["emergency_messages"],
    queryFn: async () => {
      const { messages } = await api.public.emergencyMessages();
      return messages;
    },
  });
};

export const useAllEmergencyMessages = () => {
  return useQuery({
    queryKey: ["all_emergency_messages"],
    queryFn: async () => {
      const { messages } = await api.admin.getEmergencyMessages();
      return messages;
    },
  });
};

export const useCreateEmergencyMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      title,
      message,
      imageUrl,
    }: {
      title: string;
      message: string;
      imageUrl?: string;
    }) => {
      await api.admin.createEmergencyMessage(title, message, imageUrl);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergency_messages"] });
      queryClient.invalidateQueries({ queryKey: ["all_emergency_messages"] });
    },
  });
};

export const useToggleEmergencyMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      await api.admin.toggleEmergencyMessage(id, isActive);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergency_messages"] });
      queryClient.invalidateQueries({ queryKey: ["all_emergency_messages"] });
    },
  });
};

export const useDeleteEmergencyMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      await api.admin.deleteEmergencyMessage(id);
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["emergency_messages"] });
      queryClient.invalidateQueries({ queryKey: ["all_emergency_messages"] });
    },
  });
};
