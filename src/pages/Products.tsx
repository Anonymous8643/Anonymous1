import { motion } from "framer-motion";
import { Search, Filter, TrendingUp, Clock, Users, Flame, ChevronRight } from "lucide-react";
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BottomNav } from "@/components/ui/BottomNav";
import { useProducts } from "@/hooks/useProducts";
import { Skeleton } from "@/components/ui/skeleton";
import logo from "@/assets/logo.png";

const categories = ["All", "Beginner", "Agriculture", "Technology", "Real Estate", "Energy", "Finance"];

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
              <h1 className="text-xl font-display font-bold">Products</h1>
            </div>
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              <ChevronRight className="w-5 h-5 rotate-180" />
            </Link>
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
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === category
                    ? "bg-primary text-primary-foreground"
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
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredProducts.map((product, index) => {
              const roi = ((Number(product.expected_return) - Number(product.price)) / Number(product.price) * 100).toFixed(1);
              const unitsLeft = product.total_units && product.units_sold 
                ? product.total_units - product.units_sold 
                : undefined;

              return (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="glass-card-hover overflow-hidden"
                >
                  {product.image_url && (
                    <div className="relative h-40 overflow-hidden">
                      <img 
                        src={product.image_url} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                      <div className="absolute bottom-3 left-3 flex gap-2">
                        <span className="trust-badge">{product.category}</span>
                        {product.is_popular && (
                          <span className="urgency-badge">
                            <Flame className="w-3 h-3" />
                            Popular
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="p-5">
                    <h3 className="font-display font-semibold text-lg mb-2">{product.name}</h3>
                    {product.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{product.description}</p>
                    )}

                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-2xl font-bold">
                        KES {Number(product.price).toLocaleString()}
                      </span>
                      <span className="profit-badge">
                        <TrendingUp className="w-3 h-3" />
                        +{roi}%
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {product.duration_days} days
                      </span>
                      {unitsLeft !== undefined && unitsLeft <= 10 && (
                        <span className="flex items-center gap-1 text-urgency">
                          <Users className="w-4 h-4" />
                          {unitsLeft} units left
                        </span>
                      )}
                    </div>

                    <Button 
                      className="w-full"
                      onClick={() => navigate(`/product/${product.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
