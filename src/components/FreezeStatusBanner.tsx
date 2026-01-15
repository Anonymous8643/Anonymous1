import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, Clock, Lock } from "lucide-react";
import { usePublicPlatformSettings, PlatformSetting } from "@/hooks/useAdmin";
import { useState, useEffect } from "react";

interface FreezeInfo {
  depositsFrozen: boolean;
  withdrawalsFrozen: boolean;
  maintenanceMessage: string | null;
  maintenanceEndTime: string | null;
}

export const useFreezeStatus = (): FreezeInfo & { isLoading: boolean } => {
  const { data: settings, isLoading } = usePublicPlatformSettings();

  const depositsSetting = settings?.find((s: PlatformSetting) => s.key === "deposits_frozen")?.value as Record<string, unknown> | undefined;
  const withdrawalsSetting = settings?.find((s: PlatformSetting) => s.key === "withdrawals_frozen")?.value as Record<string, unknown> | undefined;
  
  const depositsFrozen = Boolean(depositsSetting?.frozen);
  const withdrawalsFrozen = Boolean(withdrawalsSetting?.frozen);
  
  const maintenanceSetting = settings?.find((s: PlatformSetting) => s.key === "maintenance_message")?.value as Record<string, unknown> | undefined;
  const maintenanceMessage = (maintenanceSetting?.message as string) ?? null;
  const maintenanceEndTime = (maintenanceSetting?.end_time as string) ?? null;

  return {
    depositsFrozen,
    withdrawalsFrozen,
    maintenanceMessage,
    maintenanceEndTime,
    isLoading,
  };
};

const CountdownTimer = ({ endTime }: { endTime: string }) => {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const calculateTimeLeft = () => {
      const end = new Date(endTime).getTime();
      const now = Date.now();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft("Resuming soon...");
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 24) {
        const days = Math.floor(hours / 24);
        setTimeLeft(`${days}d ${hours % 24}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return (
    <span className="font-mono font-bold text-yellow-400">{timeLeft}</span>
  );
};

export const FreezeStatusBanner = () => {
  const { depositsFrozen, withdrawalsFrozen, maintenanceMessage, maintenanceEndTime, isLoading } = useFreezeStatus();
  const [dismissed, setDismissed] = useState(false);

  // Don't show while loading
  if (isLoading) {
    return null;
  }

  // Don't show if nothing is frozen and no maintenance message
  if (!depositsFrozen && !withdrawalsFrozen && !maintenanceMessage) {
    return null;
  }

  if (dismissed) {
    return null;
  }

  const frozenServices = [];
  if (depositsFrozen) frozenServices.push("Deposits");
  if (withdrawalsFrozen) frozenServices.push("Withdrawals");

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10, height: 0 }}
        animate={{ opacity: 1, y: 0, height: "auto" }}
        exit={{ opacity: 0, y: -10, height: 0 }}
        className="mx-4 mb-4 rounded-xl overflow-hidden bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30"
      >
        <div className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
              {maintenanceMessage ? (
                <Clock className="w-5 h-5 text-yellow-500" />
              ) : (
                <Lock className="w-5 h-5 text-yellow-500" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-yellow-500">
                  {maintenanceMessage ? "Scheduled Maintenance" : "Service Temporarily Paused"}
                </h4>
              </div>
              
              {maintenanceMessage ? (
                <p className="text-sm text-muted-foreground">{maintenanceMessage}</p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {frozenServices.join(" & ")} {frozenServices.length === 1 ? "is" : "are"} temporarily paused. 
                  We apologize for any inconvenience.
                </p>
              )}

              {maintenanceEndTime && (
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Resuming in:</span>
                  <CountdownTimer endTime={maintenanceEndTime} />
                </div>
              )}

              {frozenServices.length > 0 && !maintenanceMessage && (
                <div className="mt-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  <span className="text-xs text-yellow-500/80">
                    {frozenServices.join(" & ")} currently unavailable
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
