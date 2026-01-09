import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Phone, CheckCircle, AlertCircle, Clock, Loader2, Wallet, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BottomNav } from "@/components/ui/BottomNav";
import { useWallet } from "@/hooks/useWallet";
import { useProfile } from "@/hooks/useProfile";
import { useCreateWithdrawal, useUserWithdrawals } from "@/hooks/usePayments";
import { useToast } from "@/hooks/use-toast";
import { FreezeStatusBanner, useFreezeStatus } from "@/components/FreezeStatusBanner";
import logo from "@/assets/logo.png";
import { formatDistanceToNow } from "date-fns";

export default function Withdraw() {
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");

  const { data: wallet } = useWallet();
  const { data: profile } = useProfile();
  const { data: withdrawals } = useUserWithdrawals();
  const createWithdrawal = useCreateWithdrawal();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { withdrawalsFrozen } = useFreezeStatus();

  const balance = Number(wallet?.balance || 0);
  const pendingWithdrawals = withdrawals?.filter((w) => w.status === "pending") || [];

  const handleSubmit = async () => {
    if (!amount || !phoneNumber) return;

    const withdrawAmount = Number(amount);

    if (withdrawAmount > balance) {
      toast({
        variant: "destructive",
        title: "Insufficient balance",
        description: `Your available balance is KES ${balance.toLocaleString()}`,
      });
      return;
    }

    if (withdrawAmount < 100) {
      toast({
        variant: "destructive",
        title: "Minimum withdrawal",
        description: "Minimum withdrawal amount is KES 100",
      });
      return;
    }

    try {
      await createWithdrawal.mutateAsync({
        amount: withdrawAmount,
        phoneNumber,
      });

      toast({
        title: "Withdrawal requested!",
        description: "Your withdrawal is being processed. You'll receive it within 24-48 hours.",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to request withdrawal. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="px-4 py-4 max-w-lg mx-auto flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <img src={logo} alt="InvesterMate" className="w-8 h-8" />
          <h1 className="font-display font-bold text-lg">Withdraw Funds</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Freeze Status Banner */}
        <FreezeStatusBanner />
        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-gradient-to-r from-primary/20 to-trust/20 border border-primary/20"
        >
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">Available Balance</span>
          </div>
          <p className="text-3xl font-bold">KES {balance.toLocaleString()}</p>
        </motion.div>

        {/* Pending Withdrawals */}
        {pendingWithdrawals.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <h3 className="font-semibold text-yellow-500">Pending Withdrawals</h3>
            </div>
            {pendingWithdrawals.map((withdrawal) => (
              <div key={withdrawal.id} className="flex justify-between text-sm">
                <span>KES {Number(withdrawal.amount).toLocaleString()}</span>
                <span className="text-muted-foreground">
                  {formatDistanceToNow(new Date(withdrawal.created_at), { addSuffix: true })}
                </span>
              </div>
            ))}
          </motion.div>
        )}

        {/* Withdrawal Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 space-y-4"
        >
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (KES)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="text-2xl font-bold h-14"
              max={balance}
            />
            {amount && Number(amount) > balance && (
              <p className="text-xs text-destructive">Insufficient balance</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">M-PESA Phone Number</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="07XXXXXXXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="pl-10"
                defaultValue={profile?.phone || ""}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Enter the number to receive your M-PESA payment
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {[balance * 0.25, balance * 0.5, balance].map((preset, i) => (
              <Button
                key={i}
                variant="outline"
                onClick={() => setAmount(String(Math.floor(preset)))}
                className="border-primary/30"
                disabled={preset < 100}
              >
                {i === 2 ? "Max" : `${(i + 1) * 25}%`}
              </Button>
            ))}
          </div>

          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            disabled={
              createWithdrawal.isPending ||
              !amount ||
              Number(amount) < 100 ||
              Number(amount) > balance ||
              !phoneNumber ||
              withdrawalsFrozen
            }
          >
            {createWithdrawal.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : withdrawalsFrozen ? (
              <Lock className="w-4 h-4 mr-2" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            {withdrawalsFrozen ? "Withdrawals Paused" : "Request Withdrawal"}
          </Button>

          {/* Info */}
          <div className="p-4 rounded-lg bg-muted/50 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Processing time:</span>
              <span>24-48 hours</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Minimum withdrawal:</span>
              <span>KES 100</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Transaction fee:</span>
              <span className="text-profit">FREE</span>
            </div>
          </div>

          {/* Disclaimer */}
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <div className="flex gap-2">
              <AlertCircle className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="text-muted-foreground">
                  Withdrawals are processed during business hours. Large withdrawals may require additional verification.
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </main>

      <BottomNav />
    </div>
  );
}
