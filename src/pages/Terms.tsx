import { motion } from "framer-motion";
import { ArrowLeft, FileText, AlertTriangle, Scale, Clock, Ban, CheckCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

export default function Terms() {
  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="px-4 py-4 max-w-2xl mx-auto flex items-center gap-3">
          <Link to="/settings">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <img src={logo} alt="InvesterMate" className="w-8 h-8" />
          <h1 className="font-display font-bold text-lg">Terms & Conditions</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 rounded-full bg-trust/20 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-trust" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-2">Terms of Service</h2>
          <p className="text-muted-foreground">Effective: January 2026</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <Section
            icon={<CheckCircle className="w-5 h-5 text-profit" />}
            title="Acceptance of Terms"
            content="By accessing and using InvesterMate, you accept and agree to be bound by these Terms and Conditions. If you do not agree to these terms, please do not use our services."
          />

          <Section
            icon={<Scale className="w-5 h-5 text-trust" />}
            title="Investment Disclaimer"
            content="All investments carry risk. Past performance does not guarantee future results. InvesterMate provides a platform for investment opportunities but does not provide financial advice. Users are responsible for their own investment decisions."
          />

          <Section
            icon={<Clock className="w-5 h-5 text-primary" />}
            title="Investment Terms"
            items={[
              "Minimum withdrawal amount is KES 500",
              "Investment returns are processed after the maturity period",
              "Users can only hold one active investment per product at a time",
              "Withdrawals are processed within 24-48 business hours"
            ]}
          />

          <Section
            icon={<AlertTriangle className="w-5 h-5 text-urgency" />}
            title="User Responsibilities"
            items={[
              "Provide accurate and truthful information",
              "Maintain the security of your account credentials",
              "Report any unauthorized access immediately",
              "Comply with all applicable laws and regulations"
            ]}
          />

          <Section
            icon={<Ban className="w-5 h-5 text-destructive" />}
            title="Prohibited Activities"
            items={[
              "Fraudulent or illegal transactions",
              "Attempting to manipulate the platform",
              "Creating multiple accounts",
              "Sharing account credentials with others"
            ]}
          />

          <Section
            icon={<FileText className="w-5 h-5 text-muted-foreground" />}
            title="Limitation of Liability"
            content="InvesterMate shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the platform. Our liability is limited to the amount invested in your account."
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl bg-trust/10 border border-trust/20 text-center"
        >
          <p className="text-sm text-muted-foreground">
            By continuing to use InvesterMate, you acknowledge that you have read, understood, and agree to these Terms & Conditions.
          </p>
        </motion.div>
      </main>
    </div>
  );
}

function Section({ 
  icon, 
  title, 
  content, 
  items 
}: { 
  icon: React.ReactNode; 
  title: string; 
  content?: string; 
  items?: string[] 
}) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <h3 className="font-semibold">{title}</h3>
      </div>
      {content && (
        <p className="text-sm text-muted-foreground leading-relaxed">{content}</p>
      )}
      {items && (
        <ul className="space-y-2">
          {items.map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
              <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
