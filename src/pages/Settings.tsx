import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  User, Bell, Wallet, CreditCard, Moon, Sun, 
  ChevronRight, Shield, LogOut, Phone, Mail, Edit2, Save, Loader2, Eye, EyeOff, Lock, MessageSquare, AlertTriangle, Info, CheckCircle 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { BottomNav } from "@/components/ui/BottomNav";
import { useAuth } from "@/hooks/useAuth";
import { useProfile, useUpdateProfile, useToggleHideBalance } from "@/hooks/useProfile";
import { useWallet } from "@/hooks/useWallet";
import { useTransactions } from "@/hooks/useTransactions";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import logo from "@/assets/logo.png";
import { Link } from "react-router-dom";
import { useTheme } from "next-themes";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { useUserMessages, useMarkMessageRead } from "@/hooks/useAdminMessages";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function Settings() {
  const { user, signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: wallet } = useWallet();
  const { data: transactions } = useTransactions();
  const updateProfile = useUpdateProfile();
  const toggleHideBalance = useToggleHideBalance();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [notifications, setNotifications] = useState(true);
  const [hideBalance, setHideBalance] = useState(false);
  
  // User messages
  const { data: messages } = useUserMessages();
  const markAsRead = useMarkMessageRead();
  const unreadCount = messages?.filter(m => !m.is_read).length || 0;
  
  const darkMode = theme === "dark";

  const getMessageIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "success":
        return <CheckCircle className="w-4 h-4 text-profit" />;
      default:
        return <Info className="w-4 h-4 text-trust" />;
    }
  };

  const getMessageBadgeVariant = (type: string) => {
    switch (type) {
      case "warning":
        return "outline" as const;
      case "success":
        return "secondary" as const;
      default:
        return "default" as const;
    }
  };

  // Sync hideBalance state with profile
  useEffect(() => {
    if (profile) {
      setHideBalance(profile.hide_balance ?? false);
    }
  }, [profile]);

  const handleSaveProfile = async () => {
    try {
      await updateProfile.mutateAsync({
        full_name: fullName || profile?.full_name,
        phone: phone || profile?.phone,
      });
      toast({ title: "Profile updated", description: "Your changes have been saved" });
      setIsEditing(false);
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to update profile" });
    }
  };

  const handleToggleHideBalance = async (checked: boolean) => {
    setHideBalance(checked);
    try {
      await toggleHideBalance.mutateAsync(checked);
      toast({ 
        title: checked ? "Balance hidden" : "Balance visible",
        description: checked ? "Your balance is now hidden" : "Your balance is now visible"
      });
    } catch {
      setHideBalance(!checked); // Revert on error
      toast({ variant: "destructive", title: "Error", description: "Failed to update preference" });
    }
  };

  const recentTransactions = transactions?.slice(0, 5) || [];
  const displayBalance = hideBalance ? "••••••" : `KES ${Number(wallet?.balance || 0).toLocaleString()}`;

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
              <h1 className="text-xl font-display font-bold">Settings</h1>
            </div>
            <Link to="/" className="text-muted-foreground hover:text-foreground">
              <ChevronRight className="w-5 h-5 rotate-180" />
            </Link>
          </motion.div>
        </div>
      </header>

      <main className="px-4 py-6 max-w-lg mx-auto space-y-6">
        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="w-5 h-5 text-primary" />
              Profile
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (isEditing) {
                  handleSaveProfile();
                } else {
                  setFullName(profile?.full_name || "");
                  setPhone(profile?.phone || "");
                  setIsEditing(true);
                }
              }}
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isEditing ? (
                <>
                  <Save className="w-4 h-4 mr-1" />
                  Save
                </>
              ) : (
                <>
                  <Edit2 className="w-4 h-4 mr-1" />
                  Edit
                </>
              )}
            </Button>
          </div>

          {profileLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-trust flex items-center justify-center text-primary-foreground font-bold text-xl">
                  {profile?.full_name?.[0] || user?.email?.[0] || "U"}
                </div>
                <div className="flex-1">
                  {isEditing ? (
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Full Name"
                    />
                  ) : (
                    <>
                      <p className="font-medium">{profile?.full_name || "Add your name"}</p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Phone className="w-5 h-5 text-muted-foreground" />
                {isEditing ? (
                  <Input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Phone Number"
                    className="flex-1"
                  />
                ) : (
                  <span className="flex-1">{profile?.phone || "Add phone number"}</span>
                )}
              </div>

              <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <Mail className="w-5 h-5 text-muted-foreground" />
                <span className="flex-1">{user?.email}</span>
              </div>
            </div>
          )}
        </motion.div>

        {/* Notifications Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-primary" />
              Messages
            </h3>
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unreadCount} new
              </Badge>
            )}
          </div>

          {messages && messages.length > 0 ? (
            <ScrollArea className="max-h-64">
              <div className="space-y-3">
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`p-3 rounded-lg border transition-all ${
                      message.is_read 
                        ? "bg-muted/20 border-border" 
                        : "bg-primary/5 border-primary/20"
                    }`}
                    onClick={() => {
                      if (!message.is_read) {
                        markAsRead.mutate(message.id);
                      }
                    }}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{getMessageIcon(message.type)}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm truncate">{message.title}</span>
                          <Badge variant={getMessageBadgeVariant(message.type)} className="text-xs capitalize">
                            {message.type}
                          </Badge>
                          {!message.is_read && (
                            <span className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">{message.message}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No messages yet</p>
            </div>
          )}
        </motion.div>

        {/* Wallet Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6"
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" />
            Wallet & Payments
          </h3>

          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
              <div>
                <p className="font-medium">Balance</p>
                <p className="text-sm text-muted-foreground">Available funds</p>
              </div>
              <div className="flex items-center gap-2">
                <p className={`text-xl font-bold ${hideBalance ? 'text-muted-foreground' : 'text-profit'}`}>
                  {displayBalance}
                </p>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleToggleHideBalance(!hideBalance)}
                  disabled={toggleHideBalance.isPending}
                >
                  {hideBalance ? (
                    <EyeOff className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <Eye className="w-4 h-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Payment Methods
              </span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Recent Transactions */}
          <div className="mt-4">
            <p className="text-sm text-muted-foreground mb-2">Recent Transactions</p>
            <div className="space-y-2">
              {recentTransactions.length > 0 ? (
                recentTransactions.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-2 text-sm"
                  >
                    <div>
                      <p className="font-medium capitalize">{tx.type.replace("_", " ")}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(tx.created_at), { addSuffix: true })}
                      </p>
                    </div>
                    <span className={tx.type === "deposit" || tx.type === "return" || tx.type === "referral_bonus" 
                      ? "text-profit" 
                      : "text-foreground"
                    }>
                      {tx.type === "deposit" || tx.type === "return" || tx.type === "referral_bonus" ? "+" : "-"}
                      KES {hideBalance ? "••••" : Number(tx.amount).toLocaleString()}
                    </span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No transactions yet</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Preferences */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-6"
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-primary" />
            Preferences
          </h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {hideBalance ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                <div>
                  <p className="font-medium">Hide Balance</p>
                  <p className="text-sm text-muted-foreground">Blur your balance for privacy</p>
                </div>
              </div>
              <Switch
                checked={hideBalance}
                onCheckedChange={handleToggleHideBalance}
                disabled={toggleHideBalance.isPending}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {darkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                <div>
                  <p className="font-medium">Dark Mode</p>
                  <p className="text-sm text-muted-foreground">Use dark theme</p>
                </div>
              </div>
              <Switch
                checked={darkMode}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5" />
                <div>
                  <p className="font-medium">Notifications</p>
                  <p className="text-sm text-muted-foreground">Push notifications</p>
                </div>
              </div>
              <Switch
                checked={notifications}
                onCheckedChange={setNotifications}
              />
            </div>
          </div>
        </motion.div>

        {/* Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Security
          </h3>

          <div className="space-y-3">
            <Link to="/about">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  About Us
                </span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>

            <Link to="/privacy">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Privacy Policy
                </span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>

            <Link to="/terms">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Terms & Conditions
                </span>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>

            <ChangePasswordDialog />

            <Button variant="outline" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Two-Factor Authentication
              </span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Sign Out */}
        <Button
          variant="destructive"
          className="w-full"
          onClick={signOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </main>

      <BottomNav />
    </div>
  );
}
