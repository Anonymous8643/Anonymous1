import { motion } from "framer-motion";
import { ChevronRight, Shield, Brain, TrendingUp, Users, Award, Building2, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { BottomNav } from "@/components/ui/BottomNav";
import logo from "@/assets/logo.png";
import ceoImage from "@/assets/ceo-michael-chen.jpg";
import businessPermit from "@/assets/business-permit.png";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

export default function AboutUs() {
  const [showPermit, setShowPermit] = useState(false);

  const features = [
    {
      icon: Brain,
      title: "AI-Powered Investments",
      description: "Our highly powered AI analyzes market trends and balances investments, significantly lowering risks while maximizing returns."
    },
    {
      icon: Shield,
      title: "Secure & Protected",
      description: "Your investments are protected with bank-level encryption and multi-layer security protocols."
    },
    {
      icon: TrendingUp,
      title: "Smart Returns",
      description: "Our AI-driven portfolio management consistently delivers competitive returns across all investment tiers."
    },
    {
      icon: Users,
      title: "Community First",
      description: "Join thousands of investors who trust InvesterMate for their financial growth journey."
    }
  ];

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
              <h1 className="text-xl font-display font-bold">About Us</h1>
            </div>
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              <ChevronRight className="w-5 h-5 rotate-180" />
            </Link>
          </motion.div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
          >
            <img src={logo} alt="InvesterMate" className="w-24 h-24 mx-auto mb-4 drop-shadow-2xl" />
          </motion.div>
          <h2 className="text-2xl font-display font-bold gradient-text mb-2">InvesterMate</h2>
          <p className="text-muted-foreground">Your Smart Investment Partner</p>
        </motion.div>

        {/* AI Technology Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-trust flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">AI-Powered Technology</h3>
              <p className="text-sm text-muted-foreground">Advanced Investment Intelligence</p>
            </div>
          </div>
          <p className="text-muted-foreground leading-relaxed">
            InvesterMate uses <span className="text-foreground font-medium">highly powered AI</span> to analyze market conditions, 
            balance investment portfolios, and <span className="text-profit font-medium">lower risks</span> for our investors. 
            Our intelligent algorithms work 24/7 to ensure your investments are optimized for maximum returns 
            while maintaining a secure risk profile.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid gap-4">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              className="glass-card p-5"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-medium mb-1">{feature.title}</h4>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* CEO Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-card p-6"
        >
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-primary" />
            Leadership
          </h3>
          <div className="flex items-center gap-4">
            <motion.img
              src={ceoImage}
              alt="Michael Chen - CEO"
              className="w-24 h-24 rounded-xl object-cover shadow-lg"
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6 }}
            />
            <div>
              <h4 className="font-bold text-lg">Michael Chen</h4>
              <p className="text-sm text-primary mb-2">Chief Executive Officer</p>
              <p className="text-sm text-muted-foreground">
                With over 15 years in fintech and AI, Michael leads InvesterMate's mission to democratize smart investing.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Business Authorization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-6"
        >
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            Authorized Business
          </h3>
          
          <div className="bg-muted/30 rounded-xl p-4 mb-4">
            <div className="flex items-center gap-2 text-profit mb-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">Registered & Licensed</span>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Investerment Ltd is duly registered under the laws of the Republic of Kenya.
            </p>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground">Reg No:</span>
                <p className="font-medium">KBR-TRDE-2025-04871</p>
              </div>
              <div>
                <span className="text-muted-foreground">Cert No:</span>
                <p className="font-medium">CERT-0092848889</p>
              </div>
            </div>
          </div>

          <motion.button
            onClick={() => setShowPermit(true)}
            className="w-full"
            whileTap={{ scale: 0.98 }}
          >
            <img
              src={businessPermit}
              alt="Business Registration Certificate"
              className="w-full rounded-xl shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
            />
          </motion.button>
          <p className="text-xs text-center text-muted-foreground mt-2">
            Tap to view full certificate
          </p>
        </motion.div>

        {/* Trust Badges */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex justify-center gap-4 flex-wrap"
        >
          <div className="trust-badge">🔒 Bank-Level Security</div>
          <div className="trust-badge">🇰🇪 Kenya Registered</div>
          <div className="trust-badge">🤖 AI Powered</div>
        </motion.div>
      </main>

      {/* Permit Dialog */}
      <Dialog open={showPermit} onOpenChange={setShowPermit}>
        <DialogContent className="max-w-lg p-2">
          <img
            src={businessPermit}
            alt="Business Registration Certificate"
            className="w-full rounded-lg"
          />
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}