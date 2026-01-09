import { motion } from "framer-motion";
import { ArrowDownLeft, ArrowUpRight, Eye, EyeOff, Wallet, Lock } from "lucide-react";
import { useState } from "react";
import { Button } from "./button";
import { useNavigate } from "react-router-dom";
import { useFreezeStatus } from "@/components/FreezeStatusBanner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";

interface WalletCardProps {
  balance: number;
  pendingReturns: number;
}

export const WalletCard = ({ balance, pendingReturns }: WalletCardProps) => {
  const [isVisible, setIsVisible] = useState(true);
  const navigate = useNavigate();
  const { depositsFrozen, withdrawalsFrozen } = useFreezeStatus();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="relative overflow-hidden rounded-2xl p-6"
      style={{
        background: "linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--trust) / 0.1))",
      }}
    >
      {/* Background decoration */}
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-primary/10 blur-3xl" />
      <div className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-trust/10 blur-3xl" />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/20">
              <Wallet className="w-5 h-5 text-primary" />
            </div>
            <span className="font-medium text-muted-foreground">Wallet Balance</span>
          </div>
          <button
            onClick={() => setIsVisible(!isVisible)}
            className="p-2 rounded-lg hover:bg-muted/30 transition-colors"
          >
            {isVisible ? (
              <Eye className="w-5 h-5 text-muted-foreground" />
            ) : (
              <EyeOff className="w-5 h-5 text-muted-foreground" />
            )}
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="mb-6"
        >
          <p className="text-4xl font-bold font-display mb-1">
            {isVisible ? `KES ${balance.toLocaleString()}` : "••••••••"}
          </p>
          <p className="text-sm text-muted-foreground">
            Pending Returns:{" "}
            <span className="text-profit font-medium">
              {isVisible ? `+KES ${pendingReturns.toLocaleString()}` : "••••••"}
            </span>
          </p>
        </motion.div>

        <div className="flex gap-3">
          {depositsFrozen ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex-1">
                    <Button 
                      className="w-full gap-2" 
                      disabled
                    >
                      <Lock className="w-4 h-4" />
                      Deposit
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Deposits are temporarily paused</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Button 
              className="flex-1 gap-2" 
              onClick={() => navigate("/deposit")}
            >
              <ArrowDownLeft className="w-4 h-4" />
              Deposit
            </Button>
          )}
          
          {withdrawalsFrozen ? (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex-1">
                    <Button 
                      variant="outline" 
                      className="w-full gap-2 border-primary/30 text-primary"
                      disabled
                    >
                      <Lock className="w-4 h-4" />
                      Withdraw
                    </Button>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Withdrawals are temporarily paused</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ) : (
            <Button 
              variant="outline" 
              className="flex-1 gap-2 border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => navigate("/withdraw")}
            >
              <ArrowUpRight className="w-4 h-4" />
              Withdraw
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
};