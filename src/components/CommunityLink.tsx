import { motion } from "framer-motion";
import { Users, ExternalLink } from "lucide-react";
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
      className="glass-card-hover p-4 flex items-center gap-4"
    >
      <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
        <Users className="w-6 h-6 text-primary" />
      </div>
      <div className="flex-1">
        <h3 className="font-semibold">{communityName}</h3>
        <p className="text-sm text-muted-foreground">Join our community for updates & support</p>
      </div>
      <ExternalLink className="w-5 h-5 text-muted-foreground" />
    </motion.a>
  );
};
