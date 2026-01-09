import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, TrendingUp, Loader2 } from "lucide-react";
import { useInvestments } from "@/hooks/useInvestments";
import { Progress } from "@/components/ui/progress";

interface CountdownProps {
  maturesAt: string;
}

const InvestmentCountdown = ({ maturesAt }: CountdownProps) => {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date().getTime();
      const maturity = new Date(maturesAt).getTime();
      const diff = maturity - now;

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        setProgress(100);
        return;
      }

      // Calculate progress (assuming 30 day max for display)
      const totalDuration = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
      const elapsed = totalDuration - diff;
      setProgress(Math.min((elapsed / totalDuration) * 100, 99));

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [maturesAt]);

  const isComplete = timeLeft.days === 0 && timeLeft.hours === 0 && 
                     timeLeft.minutes === 0 && timeLeft.seconds === 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-4 gap-2">
        {[
          { value: timeLeft.days, label: "Days" },
          { value: timeLeft.hours, label: "Hrs" },
          { value: timeLeft.minutes, label: "Min" },
          { value: timeLeft.seconds, label: "Sec" },
        ].map((item) => (
          <div key={item.label} className="bg-muted/50 rounded-lg p-2 text-center">
            <p className="text-lg font-bold font-mono">{String(item.value).padStart(2, "0")}</p>
            <p className="text-[10px] text-muted-foreground">{item.label}</p>
          </div>
        ))}
      </div>
      <div className="space-y-1">
        <Progress value={progress} className="h-2" />
        <p className="text-xs text-muted-foreground text-center">
          {isComplete ? "Ready to mature!" : `${progress.toFixed(0)}% complete`}
        </p>
      </div>
    </div>
  );
};

export const ActiveInvestments = () => {
  const { data: investments, isLoading } = useInvestments();

  const activeInvestments = investments?.filter(inv => inv.status === "active") || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (activeInvestments.length === 0) {
    return null;
  }

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-primary" />
        <h2 className="font-semibold">Active Investments</h2>
      </div>

      <div className="space-y-3">
        {activeInvestments.map((investment, index) => (
          <motion.div
            key={investment.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-profit" />
                <span className="font-medium">Investment #{(index + 1)}</span>
              </div>
              <span className="profit-badge">Active</span>
            </div>

            <div className="flex justify-between text-sm mb-4">
              <div>
                <p className="text-muted-foreground">Invested</p>
                <p className="font-semibold">KES {Number(investment.amount).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground">Expected Return</p>
                <p className="font-semibold text-profit">KES {Number(investment.expected_return).toLocaleString()}</p>
              </div>
            </div>

            <InvestmentCountdown maturesAt={investment.matures_at} />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
};
