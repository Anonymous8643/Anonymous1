import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, User } from "lucide-react";
import { useRecentInvestments } from "@/hooks/useAdmin";

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
  return amount + variation;
};

export const LiveActivityFeed = () => {
  const { data: investments } = useRecentInvestments();

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
        <AnimatePresence>
          {investments.slice(0, 5).map((investment: any, index: number) => (
            <motion.div
              key={investment.created_at + index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <User className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium">{getRandomName(index)}</p>
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
        Real-time investment activity • Updated every 30 seconds
      </p>
    </section>
  );
};
