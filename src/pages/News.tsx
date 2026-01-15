import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Newspaper, TrendingUp, Clock, ChevronLeft, ChevronRight, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { BottomNav } from "@/components/ui/BottomNav";
import { useMarketNews } from "@/hooks/useMarketNews";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import logo from "@/assets/logo.png";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

// Static articles about InvesterMate
const companyArticles = [
  {
    id: "about-1",
    title: "Welcome to InvesterMate",
    description: "InvesterMate is Kenya's premier digital investment platform, designed to make wealth-building accessible to everyone. Our mission is to democratize investing by providing safe, transparent, and profitable investment opportunities.",
    image_url: null,
    category: "About Us",
    readTime: "3 min read"
  },
  {
    id: "about-2", 
    title: "How InvesterMate Works",
    description: "Getting started is simple: Create an account, deposit funds via M-PESA, browse our curated investment products, and watch your money grow. Our platform handles all the complexity while you enjoy the returns.",
    image_url: null,
    category: "Guide",
    readTime: "5 min read"
  },
  {
    id: "about-3",
    title: "Security First Approach",
    description: "Your security is our top priority. We employ bank-level encryption, two-factor authentication, and regular security audits to ensure your investments and data are always protected.",
    image_url: null,
    category: "Security",
    readTime: "4 min read"
  },
  {
    id: "about-4",
    title: "Investment Tips for Beginners",
    description: "Start small and diversify. Don't put all your eggs in one basket. Understand the investment duration before committing. Reinvest your returns for compound growth. Always invest what you can afford.",
    image_url: null,
    category: "Tips",
    readTime: "6 min read"
  }
];

export default function News() {
  const { data: marketNews, isLoading } = useMarketNews();
  const [selectedArticle, setSelectedArticle] = useState<typeof companyArticles[0] | null>(null);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  const activeNews = marketNews?.filter(n => n.is_active) || [];

  // Auto-slide news carousel every 5 seconds
  useEffect(() => {
    if (!carouselApi || activeNews.length <= 1) return;

    const interval = setInterval(() => {
      carouselApi.scrollNext();
    }, 5000);

    return () => clearInterval(interval);
  }, [carouselApi, activeNews.length]);

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
          <h1 className="font-display font-bold text-lg">News & Updates</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-8">
        {/* Featured News Carousel */}
        {activeNews.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-5 h-5 text-profit" />
              <h2 className="font-semibold">Market Updates</h2>
            </div>
            
            <Carousel className="w-full" setApi={setCarouselApi} opts={{ loop: true }}>
              <CarouselContent>
                {activeNews.map((news) => (
                  <CarouselItem key={news.id}>
                    <motion.div
                      className="glass-card overflow-hidden"
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.2 }}
                    >
                      {news.image_url && (
                        <div className="relative h-40 overflow-hidden">
                          <img
                            src={news.image_url}
                            alt={news.title}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-card to-transparent" />
                        </div>
                      )}
                      <div className="p-4">
                        <h3 className="font-semibold mb-2 line-clamp-2">{news.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-3">{news.description}</p>
                        <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(news.created_at), { addSuffix: true })}
                        </div>
                      </div>
                    </motion.div>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="left-2" />
              <CarouselNext className="right-2" />
            </Carousel>
          </motion.section>
        )}

        {/* Company Articles */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-trust" />
            <h2 className="font-semibold">About InvesterMate</h2>
          </div>

          <div className="space-y-4">
            {companyArticles.map((article, index) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card-hover p-4 cursor-pointer"
                onClick={() => setSelectedArticle(article)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <span className="trust-badge mb-2">{article.category}</span>
                    <h3 className="font-semibold mb-2">{article.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">{article.description}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-1" />
                </div>
                <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {article.readTime}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* All Market News */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : activeNews.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Newspaper className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">All News</h2>
            </div>

            <div className="space-y-4">
              {activeNews.map((news, index) => (
                <motion.div
                  key={news.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="glass-card p-4"
                >
                  <div className="flex gap-4">
                    {news.image_url && (
                      <img
                        src={news.image_url}
                        alt={news.title}
                        className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className="font-medium mb-1 line-clamp-2">{news.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">{news.description}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(news.created_at), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.section>
        )}

        {/* Empty state */}
        {!isLoading && activeNews.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Newspaper className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No market news available</p>
            <p className="text-sm text-muted-foreground mt-1">Check back later for updates</p>
          </motion.div>
        )}
      </main>

      {/* Article Modal */}
      <AnimatePresence>
        {selectedArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-auto"
          >
            <div className="max-w-lg mx-auto px-4 py-6">
              <Button
                variant="ghost"
                size="icon"
                className="mb-4"
                onClick={() => setSelectedArticle(null)}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span className="trust-badge mb-4">{selectedArticle.category}</span>
                <h1 className="text-2xl font-display font-bold mb-4">{selectedArticle.title}</h1>
                <div className="flex items-center gap-2 mb-6 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  {selectedArticle.readTime}
                </div>
                <div className="prose prose-invert max-w-none">
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {selectedArticle.description}
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
