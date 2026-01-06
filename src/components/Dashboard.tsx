import { motion } from "framer-motion";
import { TrendingUp, Package, Clock, Award, LogOut, Flame, Gift } from "lucide-react";
import { StatsCard } from "./ui/StatsCard";
import { ProductCard } from "./ui/ProductCard";
import { NoticeBoard } from "./ui/NoticeBoard";
import { WalletCard } from "./ui/WalletCard";
import { BottomNav } from "./ui/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useWallet } from "@/hooks/useWallet";
import { useProducts } from "@/hooks/useProducts";
import { useNotices } from "@/hooks/useNotices";
import { useInvestments } from "@/hooks/useInvestments";
import { useUserStreak, useUserLevel, useUpdateStreak } from "@/hooks/useGamification";
import { Skeleton } from "./ui/skeleton";
import { Button } from "./ui/button";
import { formatDistanceToNow } from "date-fns";
import logo from "@/assets/logo.png";
import { useEffect } from "react";
import { Link } from "react-router-dom";

export const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: wallet, isLoading: walletLoading } = useWallet();
  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: notices, isLoading: noticesLoading } = useNotices();
  const { data: investments, isLoading: investmentsLoading } = useInvestments();
  const { data: streak } = useUserStreak();
  const { data: level } = useUserLevel();
  const { mutate: updateStreak } = useUpdateStreak();

  // Update streak on dashboard load (only once per session)
  useEffect(() => {
    if (user && streak !== undefined) {
      updateStreak();
    }
  }, [user?.id]);

  const currentHour = new Date().getHours();
  const greeting =
    currentHour < 12 ? "Good morning" : currentHour < 17 ? "Good afternoon" : "Good evening";

  const userName = profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "Investor";

  // Calculate stats from real data
  const activeInvestments = investments?.filter((inv) => inv.status === "active") || [];
  const totalInvested = activeInvestments.reduce((sum, inv) => sum + Number(inv.amount), 0);
  const pendingReturns = activeInvestments.reduce((sum, inv) => sum + (Number(inv.expected_return) - Number(inv.amount)), 0);

  // Find next maturity
  const nextMaturity = activeInvestments
    .map((inv) => new Date(inv.matures_at))
    .filter((date) => date > new Date())
    .sort((a, b) => a.getTime() - b.getTime())[0];

  const nextReturnText = nextMaturity
    ? formatDistanceToNow(nextMaturity, { addSuffix: false })
    : "No active";

  // Format notices for component
  const formattedNotices = notices?.map((notice) => ({
    id: notice.id,
    title: notice.title,
    message: notice.message,
    date: formatDistanceToNow(new Date(notice.created_at), { addSuffix: true }),
    type: notice.type,
  })) || [];

  // Format products for component
  const formattedProducts = products?.slice(0, 4).map((product) => ({
    id: product.id,
    name: product.name,
    price: Number(product.price),
    expectedReturn: Number(product.expected_return),
    duration: `${product.duration_days} days`,
    progress: Math.floor(Math.random() * 100), // Simulated for display
    unitsLeft: product.total_units && product.units_sold 
      ? product.total_units - product.units_sold 
      : undefined,
    isPopular: product.is_popular || false,
    category: product.category,
    imageUrl: product.image_url,
    description: product.description,
    durationDays: product.duration_days,
  })) || [];

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
            <div className="flex items-center gap-3">
              <img src={logo} alt="InvesterMate" className="w-10 h-10" />
              <div>
                {profileLoading ? (
                  <Skeleton className="h-4 w-24 mb-1" />
                ) : (
                  <p className="text-muted-foreground text-sm">{greeting},</p>
                )}
                {profileLoading ? (
                  <Skeleton className="h-6 w-40" />
                ) : (
                  <h1 className="text-lg font-display font-bold">
                    <span className="gradient-text">{userName}</span> 👋
                  </h1>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Streak Badge */}
              <Link to="/rewards">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-1 px-2 py-1 rounded-full bg-orange-500/10 border border-orange-500/20"
                >
                  <Flame className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-bold text-orange-500">{streak?.current_streak || 0}</span>
                </motion.div>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={signOut}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-5 h-5" />
              </Button>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-trust flex items-center justify-center text-primary-foreground font-bold uppercase"
              >
                {userName[0]}
              </motion.div>
            </div>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Wallet Card */}
        {walletLoading ? (
          <Skeleton className="h-48 w-full rounded-2xl" />
        ) : (
          <WalletCard 
            balance={Number(wallet?.balance || 0)} 
            pendingReturns={pendingReturns} 
          />
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatsCard
            title="Total Invested"
            value={investmentsLoading ? "..." : `KES ${(totalInvested / 1000).toFixed(0)}K`}
            change="+12.5%"
            changeType="profit"
            icon={TrendingUp}
            delay={0.1}
          />
          <StatsCard
            title="Active Products"
            value={investmentsLoading ? "..." : String(activeInvestments.length)}
            icon={Package}
            delay={0.2}
          />
          <StatsCard
            title="Next Return"
            value={investmentsLoading ? "..." : nextReturnText}
            icon={Clock}
            delay={0.3}
          />
          <StatsCard
            title="Level"
            value={level?.level_title || "Beginner"}
            change={`${level?.total_xp || 0} XP`}
            changeType="neutral"
            icon={Award}
            delay={0.4}
          />
        </div>

        {/* Notice Board */}
        {noticesLoading ? (
          <Skeleton className="h-40 w-full rounded-xl" />
        ) : (
          <NoticeBoard notices={formattedNotices} />
        )}

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
          {productsLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-64 w-full rounded-xl" />
              <Skeleton className="h-64 w-full rounded-xl" />
            </div>
          ) : (
            <div className="space-y-4">
              {formattedProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  {...product}
                  delay={0.1 * index}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
};
