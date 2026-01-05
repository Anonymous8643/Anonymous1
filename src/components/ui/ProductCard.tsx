import { motion } from "framer-motion";
import { Clock, TrendingUp, Flame, Users } from "lucide-react";
import { Button } from "./button";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  expectedReturn: number;
  duration: string;
  progress: number;
  unitsLeft?: number;
  isPopular?: boolean;
  category: string;
  delay?: number;
}

export const ProductCard = ({
  name,
  price,
  expectedReturn,
  duration,
  progress,
  unitsLeft,
  isPopular,
  category,
  delay = 0,
}: ProductCardProps) => {
  const roi = ((expectedReturn - price) / price * 100).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{ scale: 1.02 }}
      className="glass-card-hover p-5 flex flex-col"
    >
      {/* Header badges */}
      <div className="flex items-center justify-between mb-4">
        <span className="trust-badge">{category}</span>
        <div className="flex gap-2">
          {isPopular && (
            <span className="urgency-badge">
              <Flame className="w-3 h-3" />
              Popular
            </span>
          )}
          {unitsLeft && unitsLeft <= 5 && (
            <span className="urgency-badge">
              <Users className="w-3 h-3" />
              {unitsLeft} left
            </span>
          )}
        </div>
      </div>

      {/* Product name */}
      <h3 className="font-display font-semibold text-lg mb-2">{name}</h3>

      {/* Price & ROI */}
      <div className="flex items-baseline gap-2 mb-4">
        <span className="text-2xl font-bold text-foreground">
          KES {price.toLocaleString()}
        </span>
        <span className="profit-badge">
          <TrendingUp className="w-3 h-3" />
          +{roi}%
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Expected Return</p>
          <p className="font-semibold text-profit">
            KES {expectedReturn.toLocaleString()}
          </p>
        </div>
        <div className="bg-muted/50 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Duration</p>
          <p className="font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {duration}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Maturity Progress</span>
          <span className="text-primary font-medium">{progress}%</span>
        </div>
        <div className="progress-bar">
          <motion.div
            className="progress-fill"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, delay: delay + 0.3 }}
          />
        </div>
      </div>

      {/* CTA Button */}
      <Button className="w-full mt-auto font-semibold">
        Invest Now
      </Button>
    </motion.div>
  );
};
