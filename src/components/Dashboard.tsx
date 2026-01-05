import { motion } from "framer-motion";
import { TrendingUp, Package, Clock, Award } from "lucide-react";
import { StatsCard } from "./ui/StatsCard";
import { ProductCard } from "./ui/ProductCard";
import { NoticeBoard } from "./ui/NoticeBoard";
import { WalletCard } from "./ui/WalletCard";
import { BottomNav } from "./ui/BottomNav";

// Mock data
const mockProducts = [
  {
    id: "1",
    name: "Starter Growth Fund",
    price: 5000,
    expectedReturn: 6500,
    duration: "7 days",
    progress: 45,
    unitsLeft: 3,
    isPopular: true,
    category: "Beginner",
  },
  {
    id: "2",
    name: "Premium Yield Plus",
    price: 15000,
    expectedReturn: 21000,
    duration: "14 days",
    progress: 72,
    isPopular: false,
    category: "Intermediate",
  },
  {
    id: "3",
    name: "Elite Investment Plan",
    price: 50000,
    expectedReturn: 75000,
    duration: "30 days",
    progress: 28,
    unitsLeft: 5,
    isPopular: true,
    category: "Advanced",
  },
];

const mockNotices = [
  {
    id: "1",
    title: "Welcome Bonus Available!",
    message: "New users get 10% extra returns on their first investment. Limited time offer!",
    date: "2 hours ago",
    type: "important" as const,
  },
  {
    id: "2",
    title: "System Maintenance Notice",
    message: "Scheduled maintenance on Sunday 2AM - 4AM EAT. Services may be briefly unavailable.",
    date: "1 day ago",
    type: "info" as const,
  },
  {
    id: "3",
    title: "New Products Added",
    message: "Check out our latest high-yield investment products with up to 50% returns.",
    date: "3 days ago",
    type: "update" as const,
  },
];

export const Dashboard = () => {
  const userName = "John";
  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? "Good morning" : currentHour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="px-4 py-4 max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between"
          >
            <div>
              <p className="text-muted-foreground text-sm">{greeting},</p>
              <h1 className="text-xl font-display font-bold">
                Welcome, <span className="gradient-text">{userName}</span>! 👋
              </h1>
            </div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-trust flex items-center justify-center text-primary-foreground font-bold"
            >
              {userName[0]}
            </motion.div>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Wallet Card */}
        <WalletCard balance={125750} pendingReturns={18500} />

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatsCard
            title="Total Invested"
            value="KES 85K"
            change="+12.5%"
            changeType="profit"
            icon={TrendingUp}
            delay={0.1}
          />
          <StatsCard
            title="Active Products"
            value="4"
            icon={Package}
            delay={0.2}
          />
          <StatsCard
            title="Next Return"
            value="2 days"
            icon={Clock}
            delay={0.3}
          />
          <StatsCard
            title="Level"
            value="Silver"
            change="450 XP"
            changeType="neutral"
            icon={Award}
            delay={0.4}
          />
        </div>

        {/* Notice Board */}
        <NoticeBoard notices={mockNotices} />

        {/* Products Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display font-semibold text-lg">
              Available Products
            </h2>
            <button className="text-sm text-primary hover:underline">
              See all
            </button>
          </div>
          <div className="space-y-4">
            {mockProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                {...product}
                delay={0.1 * index}
              />
            ))}
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};
