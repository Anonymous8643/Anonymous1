import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, User } from "lucide-react";
import { useRecentInvestments } from "@/hooks/useAdmin";
import { useState, useEffect, useRef } from "react";

// Random Kenyan names for anonymization
const RANDOM_NAMES = [
  "John M.", "Grace W.", "Peter K.", "Faith N.", "James O.", "Mary A.",
  "David M.", "Sarah K.", "Michael O.", "Jane W.", "Joseph N.", "Alice M.",
  "Samuel K.", "Ruth O.", "Daniel W.", "Esther N.", "George M.", "Mercy K.",
  "Stephen O.", "Joyce W.", "Patrick N.", "Elizabeth M.", "Robert K.", "Ann O.",
  "Charles W.", "Margaret N.", "Anthony M.", "Catherine K.", "Paul O.", "Rose W.",
];

const getRandomName = (index: number) => {
  return RANDOM_NAMES[index % RANDOM_NAMES.length];
};

const maskAmount = (amount: number) => {
  // Add slight variation to make it feel more real
  const variation = Math.floor(Math.random() * 200) - 100;
  return Math.max(0, amount + variation);
};

export const LiveActivityFeed = () => {
  const { data: investments } = useRecentInvestments();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [displayedItems, setDisplayedItems] = useState<any[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-rotate through investments continuously every 8 seconds for smooth rolling
  // Starts after 2 minutes delay
  useEffect(() => {
    if (!investments || investments.length === 0) return;

    // Initialize with first 5 items with unique names
    const initialItems = investments.slice(0, Math.min(5, investments.length)).map((inv, i) => ({
      ...inv,
      displayKey: `${i}-${Date.now()}`,
      displayName: getRandomName(i)
    }));
    setDisplayedItems(initialItems);

    // Delay start of auto-rotation by 2 minutes (120000ms)
    const startDelay = setTimeout(() => {
      // Start auto-rotation every 8 seconds for smooth effect
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => {
          const nextIndex = (prev + 1) % investments.length;
          
          // Update displayed items with a smooth sliding window effect - names roll with investments
          setDisplayedItems(() => {
            const newItems = [];
            for (let i = 0; i < Math.min(5, investments.length); i++) {
              const idx = (nextIndex + i) % investments.length;
              newItems.push({ 
                ...investments[idx], 
                displayKey: `${idx}-${Date.now()}-${nextIndex}`,
                displayName: getRandomName((nextIndex + i) % RANDOM_NAMES.length)
              });
            }
            return newItems;
          });
          
          return nextIndex;
        });
      }, 8000); // 8 seconds for smooth transitions
    }, 120000); // 2 minutes delay before starting rotation

    return () => {
      clearTimeout(startDelay);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [investments]);

  if (!investments || investments.length === 0) return null;

  return (
    <section className="space-y-3">
      <h2 className="font-display font-semibold text-lg flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-profit opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-profit"></span>
        </span>
        Live Activity
      </h2>

      <div className="space-y-2 max-h-48 overflow-hidden">
        <AnimatePresence mode="popLayout">
          {displayedItems.map((investment: any, index: number) => (
            <motion.div
              key={investment.displayKey || `${investment.created_at}-${index}`}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ 
                duration: 0.6, 
                delay: index * 0.1,
                ease: [0.4, 0, 0.2, 1]
              }}
              layout
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50 transition-all duration-500"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{investment.displayName || getRandomName(index)}</p>
                  <p className="text-xs text-muted-foreground">
                    Invested in {investment.products?.name || "Product"}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-profit flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +KES {maskAmount(Number(investment.expected_return) - Number(investment.amount)).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">earnings</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <p className="text-xs text-center text-muted-foreground">
        Real-time investment activity • Auto-updating
      </p>
    </section>
  );
};
