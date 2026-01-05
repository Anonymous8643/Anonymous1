import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Clock, TrendingUp, Users, Flame, CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useProduct } from "@/hooks/useProducts";
import { useCreateInvestment } from "@/hooks/useInvestments";
import { useWallet, useUpdateWallet } from "@/hooks/useWallet";
import { useCreateTransaction } from "@/hooks/useTransactions";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const { data: product, isLoading } = useProduct(id || "");
  const { data: wallet } = useWallet();
  const createInvestment = useCreateInvestment();
  const updateWallet = useUpdateWallet();
  const createTransaction = useCreateTransaction();

  const [investmentAmount, setInvestmentAmount] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  // ROI Calculator
  const amount = Number(investmentAmount) || 0;
  const roi = product ? ((Number(product.expected_return) - Number(product.price)) / Number(product.price)) : 0;
  const projectedReturn = amount * (1 + roi);
  const profit = projectedReturn - amount;

  // Simulated countdown for display
  useEffect(() => {
    if (!product) return;
    
    const updateCountdown = () => {
      const now = new Date();
      const future = new Date();
      future.setDate(future.getDate() + product.duration_days);
      
      const diff = future.getTime() - now.getTime();
      
      setCountdown({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [product]);

  const handleInvest = async () => {
    if (!product || !wallet) return;

    const investAmount = Number(investmentAmount);
    if (investAmount < Number(product.price)) {
      toast({ variant: "destructive", title: "Error", description: `Minimum investment is KES ${Number(product.price).toLocaleString()}` });
      return;
    }

    if (investAmount > Number(wallet.balance)) {
      toast({ variant: "destructive", title: "Insufficient balance", description: "Please deposit more funds" });
      return;
    }

    try {
      // Create investment
      await createInvestment.mutateAsync({
        productId: product.id,
        amount: investAmount,
        expectedReturn: projectedReturn,
        durationDays: product.duration_days,
      });

      // Update wallet
      await updateWallet.mutateAsync({
        balance: Number(wallet.balance) - investAmount,
        total_invested: Number(wallet.total_invested) + investAmount,
        pending_returns: Number(wallet.pending_returns) + profit,
      });

      // Create transaction record
      await createTransaction.mutateAsync({
        type: "investment",
        amount: investAmount,
        description: `Investment in ${product.name}`,
        reference_id: product.id,
        status: "completed",
      });

      setShowSuccess(true);
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to process investment" });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-4">
        <Skeleton className="h-64 w-full rounded-xl mb-4" />
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-full mb-4" />
        <Skeleton className="h-32 w-full rounded-xl" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Product not found</p>
      </div>
    );
  }

  const unitsLeft = product.total_units && product.units_sold 
    ? product.total_units - product.units_sold 
    : undefined;

  return (
    <div className="min-h-screen pb-8">
      {/* Success Animation */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className="w-24 h-24 rounded-full bg-profit/20 flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle className="w-12 h-12 text-profit" />
              </motion.div>
              <h2 className="text-2xl font-bold mb-2">Investment Successful!</h2>
              <p className="text-muted-foreground">Your investment has been confirmed</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl">
        <div className="px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-display font-bold text-lg">Product Details</h1>
        </div>
      </header>

      {/* Product Image */}
      {product.image_url && (
        <div className="relative h-64 overflow-hidden">
          <img 
            src={product.image_url} 
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />
        </div>
      )}

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Product Info */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="trust-badge">{product.category}</span>
            {product.is_popular && (
              <span className="urgency-badge">
                <Flame className="w-3 h-3" />
                Popular
              </span>
            )}
            {unitsLeft !== undefined && unitsLeft <= 5 && (
              <span className="urgency-badge">
                <Users className="w-3 h-3" />
                {unitsLeft} left!
              </span>
            )}
          </div>
          
          <h1 className="text-2xl font-display font-bold mb-2">{product.name}</h1>
          <p className="text-muted-foreground">{product.description}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Min Investment</p>
            <p className="font-bold text-lg">KES {Number(product.price).toLocaleString()}</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Returns</p>
            <p className="font-bold text-lg text-profit">+{(roi * 100).toFixed(1)}%</p>
          </div>
          <div className="glass-card p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">Duration</p>
            <p className="font-bold text-lg">{product.duration_days}d</p>
          </div>
        </div>

        {/* Countdown */}
        <div className="glass-card p-4">
          <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Time until maturity (after purchase)
          </p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { value: countdown.days, label: "Days" },
              { value: countdown.hours, label: "Hours" },
              { value: countdown.minutes, label: "Mins" },
              { value: countdown.seconds, label: "Secs" },
            ].map((item) => (
              <div key={item.label} className="bg-muted/50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold font-mono">{String(item.value).padStart(2, "0")}</p>
                <p className="text-xs text-muted-foreground">{item.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ROI Calculator */}
        <div className="glass-card p-4">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            ROI Calculator
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Investment Amount (KES)</label>
              <Input
                type="number"
                placeholder={`Min. ${Number(product.price).toLocaleString()}`}
                value={investmentAmount}
                onChange={(e) => setInvestmentAmount(e.target.value)}
                className="text-lg"
              />
            </div>

            {amount > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-3 pt-4 border-t border-border"
              >
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Investment</span>
                  <span className="font-medium">KES {amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Expected Profit</span>
                  <span className="font-medium text-profit">+KES {profit.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg">
                  <span className="font-semibold">Total Return</span>
                  <span className="font-bold text-profit">KES {projectedReturn.toLocaleString()}</span>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Available Balance */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Available Balance</span>
          <span className="font-medium">KES {Number(wallet?.balance || 0).toLocaleString()}</span>
        </div>

        {/* Invest Button */}
        <Button 
          className="w-full h-14 text-lg font-semibold"
          disabled={!amount || amount < Number(product.price) || createInvestment.isPending}
          onClick={handleInvest}
        >
          {createInvestment.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            `Invest KES ${amount.toLocaleString()}`
          )}
        </Button>
      </main>
    </div>
  );
}
