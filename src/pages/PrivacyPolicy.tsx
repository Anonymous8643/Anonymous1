import { motion } from "framer-motion";
import { ArrowLeft, Shield, Lock, Eye, Database, Bell, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

export default function PrivacyPolicy() {
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
          <h1 className="font-display font-bold text-lg">Privacy Policy</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-2xl mx-auto space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-display font-bold mb-2">Your Privacy Matters</h2>
          <p className="text-muted-foreground">Last updated: January 2026</p>
        </motion.div>

        {/* Sections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-6"
        >
          <Section
            icon={<Database className="w-5 h-5 text-primary" />}
            title="Information We Collect"
            content={[
              "Personal identification information (Name, email address, phone number)",
              "Financial information for transaction processing",
              "Device information and usage data for app improvement",
              "Investment preferences and transaction history"
            ]}
          />

          <Section
            icon={<Lock className="w-5 h-5 text-primary" />}
            title="How We Protect Your Data"
            content={[
              "End-to-end encryption for all sensitive data",
              "Secure servers with 24/7 monitoring",
              "Regular security audits and updates",
              "Two-factor authentication available for all accounts"
            ]}
          />

          <Section
            icon={<Eye className="w-5 h-5 text-primary" />}
            title="How We Use Your Information"
            content={[
              "Process your investment transactions securely",
              "Send important account notifications",
              "Improve our services and user experience",
              "Comply with legal and regulatory requirements"
            ]}
          />

          <Section
            icon={<Bell className="w-5 h-5 text-primary" />}
            title="Your Rights"
            content={[
              "Access your personal data at any time",
              "Request correction of inaccurate information",
              "Delete your account and associated data",
              "Opt-out of marketing communications"
            ]}
          />

          <Section
            icon={<Mail className="w-5 h-5 text-primary" />}
            title="Contact Us"
            content={[
              "For privacy-related inquiries, contact our support team",
              "Email: privacy@investermate.com",
              "Response time: Within 48 business hours"
            ]}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl bg-muted/30 border border-border text-center"
        >
          <p className="text-sm text-muted-foreground">
            By using InvesterMate, you agree to the collection and use of information in accordance with this policy.
          </p>
        </motion.div>
      </main>
    </div>
  );
}

function Section({ icon, title, content }: { icon: React.ReactNode; title: string; content: string[] }) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-3 mb-3">
        {icon}
        <h3 className="font-semibold">{title}</h3>
      </div>
      <ul className="space-y-2">
        {content.map((item, index) => (
          <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
