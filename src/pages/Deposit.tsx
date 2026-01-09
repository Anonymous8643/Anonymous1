import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Phone, Copy, CheckCircle, AlertCircle, Clock, Loader2, MessageCircle, Lock } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BottomNav } from "@/components/ui/BottomNav";
import { useCurrentPaymentNumber } from "@/hooks/useAdmin";
import { useCreateDeposit, useUserDeposits } from "@/hooks/usePayments";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/hooks/use-toast";
import { FreezeStatusBanner, useFreezeStatus } from "@/components/FreezeStatusBanner";
import logo from "@/assets/logo.png";
import { formatDistanceToNow } from "date-fns";

export default function Deposit() {
  const [step, setStep] = useState<"amount" | "instructions" | "confirm">("amount");
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [mpesaCode, setMpesaCode] = useState("");
  const [copied, setCopied] = useState(false);

  const paymentNumber = useCurrentPaymentNumber();
  const { data: profile } = useProfile();
  const { data: deposits } = useUserDeposits();
  const createDeposit = useCreateDeposit();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { depositsFrozen } = useFreezeStatus();

  const handleCopy = () => {
    if (paymentNumber) {
      navigator.clipboard.writeText(paymentNumber.phone_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSubmit = async () => {
    if (!amount || !phoneNumber || !paymentNumber) return;

    try {
      await createDeposit.mutateAsync({
        amount: Number(amount),
        phoneNumber,
        mpesaCode: mpesaCode || undefined,
        paymentNumberUsed: paymentNumber.phone_number,
      });

      toast({
        title: "Deposit submitted!",
        description: "Your deposit is pending approval. You'll be notified once confirmed.",
      });

      navigate("/");
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit deposit. Please try again.",
      });
    }
  };

  const pendingDeposits = deposits?.filter((d) => d.status === "pending") || [];

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
          <h1 className="font-display font-bold text-lg">Deposit Funds</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Freeze Status Banner */}
        <FreezeStatusBanner />
        {/* Pending Deposits */}
        {pendingDeposits.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20"
          >
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-yellow-500" />
              <h3 className="font-semibold text-yellow-500">Pending Deposits</h3>
            </div>
            {pendingDeposits.map((deposit) => (
              <div key={deposit.id} className="flex justify-between text-sm">
                <span>KES {Number(deposit.amount).toLocaleString()}</span>
                <span className="text-muted-foreground">
                  {formatDistanceToNow(new Date(deposit.created_at), { addSuffix: true })}
                </span>
              </div>
            ))}
          </motion.div>
        )}

        {step === "amount" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="glass-card p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (KES)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="text-2xl font-bold h-14"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Your M-PESA Phone Number</Label>
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
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[500, 1000, 5000].map((preset) => (
                  <Button
                    key={preset}
                    variant="outline"
                    onClick={() => setAmount(String(preset))}
                    className="border-primary/30"
                  >
                    KES {preset.toLocaleString()}
                  </Button>
                ))}
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={() => setStep("instructions")}
                disabled={!amount || Number(amount) < 100 || !phoneNumber || depositsFrozen}
              >
                {depositsFrozen ? (
                  <>
                    <Lock className="w-4 h-4 mr-2" />
                    Deposits Paused
                  </>
                ) : (
                  "Continue to Payment"
                )}
              </Button>
            </div>
          </motion.div>
        )}

        {step === "instructions" && paymentNumber && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="glass-card p-6">
              <h2 className="text-xl font-bold mb-4 text-center">M-PESA Payment Instructions</h2>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <p className="text-sm text-muted-foreground mb-1">Send to this number:</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-primary">{paymentNumber.phone_number}</span>
                    <Button variant="ghost" size="sm" onClick={handleCopy}>
                      {copied ? <CheckCircle className="w-5 h-5 text-profit" /> : <Copy className="w-5 h-5" />}
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground">{paymentNumber.account_name}</p>
                </div>

                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground mb-1">Amount:</p>
                  <p className="text-2xl font-bold">KES {Number(amount).toLocaleString()}</p>
                </div>

                <div className="space-y-2 text-sm">
                  <p className="font-semibold">Follow these steps:</p>
                  <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
                    <li>Open M-PESA on your phone</li>
                    <li>Select "Send Money"</li>
                    <li>Enter the number: <span className="text-foreground font-medium">{paymentNumber.phone_number}</span></li>
                    <li>Enter amount: <span className="text-foreground font-medium">KES {Number(amount).toLocaleString()}</span></li>
                    <li>Enter your M-PESA PIN and confirm</li>
                    <li>Copy the M-PESA confirmation code</li>
                  </ol>
                </div>

                <Button className="w-full" size="lg" onClick={() => setStep("confirm")}>
                  I've Made the Payment
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {step === "confirm" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="glass-card p-6 space-y-4">
              <h2 className="text-xl font-bold text-center">Confirm Your Deposit</h2>

              <div className="space-y-2">
                <Label htmlFor="mpesa">M-PESA Confirmation Code (Optional)</Label>
                <Input
                  id="mpesa"
                  placeholder="e.g. SHK1234567"
                  value={mpesaCode}
                  onChange={(e) => setMpesaCode(e.target.value.toUpperCase())}
                  className="uppercase"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the code from your M-PESA message for faster verification
                </p>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount:</span>
                  <span className="font-bold">KES {Number(amount).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">From:</span>
                  <span>{phoneNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">To:</span>
                  <span>{paymentNumber?.phone_number}</span>
                </div>
              </div>

              <Button
                className="w-full"
                size="lg"
                onClick={handleSubmit}
                disabled={createDeposit.isPending}
              >
                {createDeposit.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle className="w-4 h-4 mr-2" />
                )}
                Submit Deposit
              </Button>

              {/* Disclaimer */}
              <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-semibold text-yellow-500 mb-1">Important Notice</p>
                    <p className="text-muted-foreground">
                      If your deposit doesn't reflect within 24 hours, please contact our support team via WhatsApp:
                    </p>
                    <a
                      href="https://wa.me/254745745186"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 mt-2 text-primary hover:underline"
                    >
                      <MessageCircle className="w-4 h-4" />
                      +254 745 745 186
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
