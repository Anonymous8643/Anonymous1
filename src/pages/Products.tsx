import { motion, AnimatePresence } from "framer-motion";
import { Search, TrendingUp, Clock, Users, Flame, ChevronRight, Sparkles, Zap, Award, Star } from "lucide-react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BottomNav } from "@/components/ui/BottomNav";
import { useProducts } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";
import logo from "@/assets/logo.png";
import goldProductImage from "@/assets/gold-product.jpg";

const categories = ["All", "Beginner", "Agriculture", "Technology", "Real Estate", "Energy", "Finance"];

// Psychology-based urgency messages
const urgencyMessages = [
  "🔥 Selling fast!",
  "⚡ Limited spots!",
  "🚀 High demand!",
  "💎 Premium pick!",
];

export default function Products() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const { data: products, isLoading } = useProducts();
  const navigate = useNavigate();

  const filteredProducts = products?.filter((product) => {
    const matchesCategory = selectedCategory === "All" || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }) || [];

  // Sort products for psychology: popular first, then by ROI
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (a.is_popular && !b.is_popular) return -1;
    if (!a.is_popular && b.is_popular) return 1;
    const roiA = (Number(a.expected_return) - Number(a.price)) / Number(a.price);
    const roiB = (Number(b.expected_return) - Number(b.price)) / Number(b.price);
    return roiB - roiA;
  });

  // Get image for product - use product's stored image_url consistently
  const getProductImage = (product: any) => {
    // Use the product's image_url if available, otherwise use gold image as fallback
    if (product.image_url) {
      return product.image_url;
    }
    // Fallback for products without images
    const name = product.name?.toLowerCase() || "";
    if (name.includes("gold") || name.includes("premium") || name.includes("elite")) {
      return goldProductImage;
    }
    return goldProductImage; // Default fallback
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="px-4 py-4 max-w-lg mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between mb-4"
          >
            <div className="flex items-center gap-3">
              <img src={logo} alt="InvesterMate" className="w-10 h-10" />
              <div>
                <h1 className="text-xl font-display font-bold">Products</h1>
                <p className="text-xs text-muted-foreground">Choose your investment</p>
              </div>
            </div>
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              <ChevronRight className="w-5 h-5 rotate-180" />
            </Link>
          </motion.div>
          
          {/* Motivational Banner */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-primary/20 to-trust/20 rounded-xl p-3 mb-4 flex items-center gap-3"
          >
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            <p className="text-sm font-medium">Start growing your wealth today!</p>
          </motion.div>
          
          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Category filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {categories.map((category) => (
              <motion.button
                key={category}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ${
                  selectedCategory === category
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {category}
              </motion.button>
            ))}
          </div>
        </div>
      </header>

      {/* Products Grid */}
      <main className="px-4 py-6 max-w-lg mx-auto">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-80 w-full rounded-xl" />
            ))}
          </div>
        ) : sortedProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-5">
              {sortedProducts.map((product, index) => {
                const roi = ((Number(product.expected_return) - Number(product.price)) / Number(product.price) * 100).toFixed(1);
                const unitsLeft = product.total_units && product.units_sold 
                  ? product.total_units - product.units_sold 
                  : undefined;
                const isHighROI = parseFloat(roi) >= 20;
                const imageUrl = getProductImage(product);
                const urgencyMessage = urgencyMessages[index % urgencyMessages.length];

                return (
                  <motion.div
                    key={product.id}
                    layout
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{ 
                      delay: index * 0.1,
                      type: "spring",
                      stiffness: 300,
                      damping: 25
                    }}
                    whileHover={{ scale: 1.02, y: -5 }}
                    className="glass-card-hover overflow-hidden relative group"
                  >
                    {/* Premium Glow Effect for Popular */}
                    {product.is_popular && (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-profit/10 pointer-events-none" />
                    )}
                    
                    {imageUrl && (
                      <div className="relative h-44 overflow-hidden">
                        <motion.img 
                          src={imageUrl} 
                          alt={product.name}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-card via-card/50 to-transparent" />
                        
                        {/* Floating Badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-2">
                          <span className="trust-badge backdrop-blur-md">{product.category}</span>
                          {product.is_popular && (
                            <motion.span 
                              className="urgency-badge flex items-center gap-1"
                              animate={{ scale: [1, 1.05, 1] }}
                              transition={{ repeat: Infinity, duration: 2 }}
                            >
                              <Flame className="w-3 h-3" />
                              Popular
                            </motion.span>
                          )}
                        </div>
                        
                        {/* Top Right ROI Badge */}
                        <div className="absolute top-3 right-3">
                          <motion.div 
                            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-bold shadow-lg ${
                              isHighROI 
                                ? "bg-profit text-white" 
                                : "bg-background/90 backdrop-blur-md text-profit"
                            }`}
                            animate={isHighROI ? { scale: [1, 1.1, 1] } : {}}
                            transition={{ repeat: Infinity, duration: 2, delay: index * 0.2 }}
                          >
                            <TrendingUp className="w-4 h-4" />
                            +{roi}%
                          </motion.div>
                        </div>

                        {/* Bottom Urgency Message */}
                        {(unitsLeft !== undefined && unitsLeft <= 10) && (
                          <motion.div 
                            className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-urgency/90 text-white text-xs font-medium"
                            animate={{ opacity: [0.8, 1, 0.8] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          >
                            <Zap className="w-3 h-3" />
                            {unitsLeft} units left
                          </motion.div>
                        )}
                      </div>
                    )}
                    
                    <div className="p-5">
                      {/* Product Name with Star for Popular */}
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-display font-semibold text-lg flex items-center gap-2">
                          {product.name}
                          {product.is_popular && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                        </h3>
                      </div>
                      
                      {product.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{product.description}</p>
                      )}

                      {/* Price & Stats */}
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <p className="text-xs text-muted-foreground">Investment</p>
                          <span className="text-2xl font-bold">
                            KES {Number(product.price).toLocaleString()}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Returns</p>
                          <span className="text-lg font-bold text-profit">
                            KES {Number(product.expected_return).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {product.duration_days} days
                        </span>
                        {product.is_popular && (
                          <span className="flex items-center gap-1 text-profit">
                            <Award className="w-4 h-4" />
                            Top Pick
                          </span>
                        )}
                      </div>

                      {/* CTA Button with Urgency */}
                      <motion.div
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Button 
                          className="w-full font-semibold shadow-lg shadow-primary/25 group"
                          onClick={() => navigate(`/product/${product.id}`)}
                        >
                          <span>Invest Now</span>
                          <ChevronRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                        </Button>
                      </motion.div>
                      
                      {/* Social Proof */}
                      {product.units_sold && product.units_sold > 0 && (
                        <p className="text-xs text-center text-muted-foreground mt-3 flex items-center justify-center gap-1">
                          <Users className="w-3 h-3" />
                          {product.units_sold}+ investors have chosen this
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
