import { motion } from "framer-motion";
import { Home, Package, Users, Settings, Wallet } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const navItems = [
  { id: "home", path: "/", label: "Home", icon: Home },
  { id: "products", path: "/products", label: "Products", icon: Package },
  { id: "wallet", path: "/", label: "Wallet", icon: Wallet },
  { id: "referrals", path: "/referrals", label: "Referrals", icon: Users },
  { id: "settings", path: "/settings", label: "Settings", icon: Settings },
];

export const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getActiveTab = () => {
    const path = location.pathname;
    if (path === "/") return "home";
    if (path === "/products" || path.startsWith("/product/")) return "products";
    if (path === "/referrals") return "referrals";
    if (path === "/settings") return "settings";
    return "home";
  };

  const activeTab = getActiveTab();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-xl border-t border-border">
      <div className="flex items-center justify-around py-2 px-4 max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className="relative flex flex-col items-center py-2 px-3 min-w-[60px]"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  transition={{ type: "spring", duration: 0.5 }}
                />
              )}
              <motion.div
                animate={{ scale: isActive ? 1.1 : 1 }}
                transition={{ type: "spring", stiffness: 500 }}
              >
                <item.icon
                  className={`w-5 h-5 transition-colors ${
                    isActive ? "text-primary" : "text-muted-foreground"
                  }`}
                />
              </motion.div>
              <span
                className={`text-xs mt-1 font-medium transition-colors ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
