import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, ChevronLeft, ChevronRight, X } from "lucide-react";
import { usePaymentScreenshots } from "@/hooks/usePaymentScreenshots";
import { Skeleton } from "./ui/skeleton";

export const PaymentProofs = () => {
  const { data: screenshots, isLoading } = usePaymentScreenshots();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // Auto-slide every 4 seconds
  useEffect(() => {
    if (!screenshots || screenshots.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev === screenshots.length - 1 ? 0 : prev + 1));
    }, 4000);

    return () => clearInterval(interval);
  }, [screenshots]);
  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-xl" />;
  }

  if (!screenshots || screenshots.length === 0) {
    return null;
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? screenshots.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === screenshots.length - 1 ? 0 : prev + 1));
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card overflow-hidden"
      >
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <Camera className="w-5 h-5 text-profit" />
            <h3 className="font-semibold">Payment Proofs</h3>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Real payments to our investors
          </p>
        </div>

        <div className="relative">
          {/* Image carousel */}
          <div className="relative h-48 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.img
                key={screenshots[currentIndex].id}
                src={screenshots[currentIndex].image_url}
                alt={screenshots[currentIndex].caption || "Payment proof"}
                className="w-full h-full object-cover cursor-pointer"
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                onClick={() => setSelectedImage(screenshots[currentIndex].image_url)}
              />
            </AnimatePresence>
          </div>

          {/* Navigation arrows */}
          {screenshots.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center text-foreground hover:bg-background transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Dots indicator */}
          {screenshots.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
              {screenshots.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentIndex
                      ? "bg-primary"
                      : "bg-background/50 backdrop-blur-sm"
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Caption */}
        {screenshots[currentIndex].caption && (
          <div className="p-3 bg-muted/30">
            <p className="text-sm text-center text-muted-foreground">
              {screenshots[currentIndex].caption}
            </p>
          </div>
        )}
      </motion.div>

      {/* Fullscreen modal */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setSelectedImage(null)}
          >
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <motion.img
              src={selectedImage}
              alt="Payment proof"
              className="max-w-full max-h-full object-contain rounded-lg"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
