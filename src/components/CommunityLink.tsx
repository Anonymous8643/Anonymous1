import { motion } from "framer-motion";
import { Users, ExternalLink, MessageCircle } from "lucide-react";
import { usePublicPlatformSettings } from "@/hooks/useAdmin";

export const CommunityLink = () => {
  const { data: settings } = usePublicPlatformSettings();
  
  const communitySetting = settings?.find(s => s.key === "community_link");
  const communityUrl = (communitySetting?.value as { url?: string })?.url;
  const communityName = (communitySetting?.value as { name?: string })?.name || "Community Groups";
  
  if (!communityUrl) return null;
  
  return (
    <motion.a
      href={communityUrl}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="block relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 p-4 shadow-lg"
    >
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
      
      <div className="relative flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-sm">
          <MessageCircle className="w-7 h-7 text-white" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-white text-lg">{communityName}</h3>
          <p className="text-white/80 text-sm">Join our community for updates & support</p>
        </div>
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
          <ExternalLink className="w-5 h-5 text-white" />
        </div>
      </div>
      
      {/* Animated pulse effect */}
      <motion.div
        className="absolute inset-0 bg-white/10 rounded-2xl"
        animate={{ opacity: [0, 0.2, 0] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    </motion.a>
  );
};
