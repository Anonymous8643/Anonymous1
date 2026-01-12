import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePublicPlatformSettings } from "@/hooks/useAdmin";

interface CountdownProps {
  endTime: string;
}

const CountdownTimer = ({ endTime }: CountdownProps) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const end = new Date(endTime).getTime();
      const diff = end - now;

      if (diff <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 };
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      return { days, hours, minutes, seconds };
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, [endTime]);

  const TimeBlock = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center">
      <div className="bg-destructive/90 text-destructive-foreground px-3 py-2 rounded-lg min-w-[50px]">
        <span className="text-2xl font-bold tabular-nums">{String(value).padStart(2, '0')}</span>
      </div>
      <span className="text-xs text-destructive mt-1 font-medium uppercase tracking-wide">{label}</span>
    </div>
  );

  return (
    <div className="flex items-center gap-2 justify-center mt-4">
      <TimeBlock value={timeLeft.days} label="Days" />
      <span className="text-destructive text-2xl font-bold">:</span>
      <TimeBlock value={timeLeft.hours} label="Hours" />
      <span className="text-destructive text-2xl font-bold">:</span>
      <TimeBlock value={timeLeft.minutes} label="Mins" />
      <span className="text-destructive text-2xl font-bold">:</span>
      <TimeBlock value={timeLeft.seconds} label="Secs" />
    </div>
  );
};

export const OverlayMessage = () => {
  const { data: settings, isLoading } = usePublicPlatformSettings();
  const [dismissed, setDismissed] = useState(false);

  const overlaySettings = settings?.find(s => s.key === "overlay_message")?.value as {
    message?: string | null;
    end_time?: string | null;
    is_active?: boolean;
  } | undefined;

  const message = overlaySettings?.message;
  const endTime = overlaySettings?.end_time;
  const isActive = overlaySettings?.is_active;

  // Check if the message has expired
  const hasExpired = endTime ? new Date(endTime).getTime() < new Date().getTime() : false;

  if (isLoading || !message || !isActive || hasExpired || dismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative max-w-md w-full bg-background border border-destructive/50 rounded-2xl p-6 shadow-2xl"
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 text-muted-foreground hover:text-foreground"
            onClick={() => setDismissed(true)}
          >
            <X className="w-5 h-5" />
          </Button>

          {/* Warning icon */}
          <div className="flex justify-center mb-4">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center"
            >
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </motion.div>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-center mb-2 text-destructive">
            Important Notice
          </h2>

          {/* Message */}
          <p className="text-center text-foreground whitespace-pre-wrap">
            {message}
          </p>

          {/* Countdown Timer */}
          {endTime && <CountdownTimer endTime={endTime} />}

          {/* Dismiss button */}
          <div className="mt-6 flex justify-center">
            <Button
              variant="outline"
              className="border-destructive/50 text-destructive hover:bg-destructive/10"
              onClick={() => setDismissed(true)}
            >
              I Understand
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
