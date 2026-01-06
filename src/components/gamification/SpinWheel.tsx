import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Gift, Sparkles, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTodaySpins, useRecordSpin } from "@/hooks/useGamification";
import { useToast } from "@/hooks/use-toast";
import confetti from "canvas-confetti";

const PRIZES = [
  { label: "KES 10", value: 10, color: "from-emerald-500 to-emerald-600", probability: 0.35 },
  { label: "KES 50", value: 50, color: "from-blue-500 to-blue-600", probability: 0.25 },
  { label: "KES 100", value: 100, color: "from-purple-500 to-purple-600", probability: 0.20 },
  { label: "2x Returns", value: 0, color: "from-amber-500 to-amber-600", probability: 0.10, special: true },
  { label: "KES 500", value: 500, color: "from-pink-500 to-pink-600", probability: 0.07 },
  { label: "KES 1,000", value: 1000, color: "from-red-500 to-red-600", probability: 0.025 },
  { label: "JACKPOT!", value: 10000, color: "from-yellow-400 to-amber-500", probability: 0.005, jackpot: true },
  { label: "Try Again", value: 0, color: "from-gray-500 to-gray-600", probability: 0.0 },
];

export const SpinWheel = () => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [prize, setPrize] = useState<typeof PRIZES[0] | null>(null);
  const [showPrize, setShowPrize] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const { data: todaySpins } = useTodaySpins();
  const { mutateAsync: recordSpin } = useRecordSpin();
  const { toast } = useToast();

  const freeSpinsUsed = todaySpins?.filter(s => s.prize_type === "free").length || 0;
  const hasFreeSpin = freeSpinsUsed < 1;

  const spinWheel = async () => {
    if (isSpinning || !hasFreeSpin) return;

    setIsSpinning(true);
    setShowPrize(false);
    setPrize(null);

    // Determine prize based on probability
    const random = Math.random();
    let cumulative = 0;
    let selectedPrize = PRIZES[PRIZES.length - 1];

    for (const p of PRIZES) {
      cumulative += p.probability;
      if (random <= cumulative) {
        selectedPrize = p;
        break;
      }
    }

    // Calculate rotation to land on prize
    const prizeIndex = PRIZES.indexOf(selectedPrize);
    const segmentAngle = 360 / PRIZES.length;
    const targetAngle = 360 - (prizeIndex * segmentAngle) - (segmentAngle / 2);
    const spins = 5 + Math.floor(Math.random() * 3); // 5-7 full rotations
    const finalRotation = rotation + (spins * 360) + targetAngle;

    setRotation(finalRotation);

    // Wait for spin to complete
    setTimeout(async () => {
      setPrize(selectedPrize);
      setShowPrize(true);
      setIsSpinning(false);

      // Record the spin
      await recordSpin({
        prizeType: "free",
        prizeValue: selectedPrize.value,
      });

      // Celebration effects
      if (selectedPrize.jackpot) {
        confetti({
          particleCount: 200,
          spread: 100,
          origin: { y: 0.6 },
          colors: ["#FFD700", "#FFA500", "#FF6347"],
        });
        toast({
          title: "🎉 JACKPOT!",
          description: `You won KES ${selectedPrize.value.toLocaleString()}!`,
        });
      } else if (selectedPrize.value > 0) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
        toast({
          title: "Congratulations!",
          description: `You won ${selectedPrize.label}!`,
        });
      }
    }, 4000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Gift className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-display font-bold text-lg">Daily Spin</h3>
            <p className="text-muted-foreground text-sm">
              {hasFreeSpin ? "1 free spin available!" : "Come back tomorrow!"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setSoundEnabled(!soundEnabled)}
          className="p-2 rounded-lg hover:bg-muted transition-colors"
        >
          {soundEnabled ? (
            <Volume2 className="w-5 h-5 text-muted-foreground" />
          ) : (
            <VolumeX className="w-5 h-5 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Wheel */}
      <div className="relative w-64 h-64 mx-auto mb-6">
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10">
          <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-primary" />
        </div>

        {/* Wheel */}
        <motion.div
          animate={{ rotate: rotation }}
          transition={{ duration: 4, ease: [0.17, 0.67, 0.12, 0.99] }}
          className="w-full h-full rounded-full relative overflow-hidden border-4 border-primary/20"
          style={{
            background: "conic-gradient(from 0deg, " +
              PRIZES.map((p, i) => 
                `hsl(var(--${p.color.includes('emerald') ? 'primary' : 'secondary'})) ${i * (100/PRIZES.length)}% ${(i+1) * (100/PRIZES.length)}%`
              ).join(", ") + ")"
          }}
        >
          {PRIZES.map((p, i) => {
            const angle = (i * 360) / PRIZES.length + (180 / PRIZES.length);
            return (
              <div
                key={i}
                className="absolute top-1/2 left-1/2 origin-left text-[10px] font-bold text-white whitespace-nowrap"
                style={{
                  transform: `rotate(${angle}deg) translateX(20px)`,
                }}
              >
                {p.label}
              </div>
            );
          })}

          {/* Center */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-16 h-16 rounded-full bg-background border-4 border-primary flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Spin Button */}
      <Button
        onClick={spinWheel}
        disabled={isSpinning || !hasFreeSpin}
        className="w-full gap-2"
        size="lg"
      >
        {isSpinning ? (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-5 h-5" />
            </motion.div>
            Spinning...
          </>
        ) : hasFreeSpin ? (
          <>
            <Gift className="w-5 h-5" />
            Spin to Win!
          </>
        ) : (
          "No spins left today"
        )}
      </Button>

      {/* Prize Modal */}
      <AnimatePresence>
        {showPrize && prize && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded-xl z-20"
          >
            <div className="text-center p-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className={`
                  w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center
                  bg-gradient-to-br ${prize.color}
                `}
              >
                {prize.jackpot ? (
                  <span className="text-3xl">🎉</span>
                ) : (
                  <Gift className="w-10 h-10 text-white" />
                )}
              </motion.div>
              <h3 className="text-xl font-bold mb-2">
                {prize.value > 0 ? "You Won!" : prize.special ? "Bonus!" : "Better luck next time!"}
              </h3>
              <p className="text-2xl font-display font-bold gradient-text mb-4">
                {prize.label}
              </p>
              <Button onClick={() => setShowPrize(false)} variant="outline">
                Continue
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
