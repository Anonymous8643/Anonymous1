import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Users, Wallet, Phone, CheckCircle, XCircle, 
  Plus, AlertTriangle, TrendingUp, TrendingDown,
  Search, ArrowLeft, Shield, MessageSquare, BarChart3,
  Newspaper, Bell, PauseCircle, PlayCircle, Image, Upload,
  Trash2, Award, ChevronLeft, ChevronRight, Timer, Megaphone,
  MessageCircle, RefreshCw, Eye, AlertOctagon, Globe, Monitor,
  Package
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { 
  useIsAdmin, 
  usePendingDeposits, 
  usePendingWithdrawals,
  useApproveDeposit,
  useProcessWithdrawal,
  useAllUsers,
  useUpdateUserBalance,
  useAllPaymentNumbers,
  useAddPaymentNumber,
  useTogglePaymentNumber,
  useDeletePaymentNumber,
  usePlatformStats,
  useAllMarketNews,
  useCreateMarketNews,
  useToggleMarketNews,
  useDeleteMarketNews,
  useAllNotices,
  useCreateNotice,
  useToggleNotice,
  useDeleteNotice,
  useDeleteUser,
  usePlatformSettings,
  useUpdatePlatformSetting,
  useUploadImage,
  useResetAllData,
  useSuspiciousActivities,
  useResolveSuspiciousActivity,
  useAllProducts,
  useToggleProduct,
} from "@/hooks/useAdmin";
import {
  useAllEmergencyMessages,
  useCreateEmergencyMessage,
  useToggleEmergencyMessage,
  useDeleteEmergencyMessage,
} from "@/hooks/useEmergencyMessages";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Admin() {
  const { data: isAdmin, isLoading: checkingAdmin } = useIsAdmin();
  const { data: deposits } = usePendingDeposits();
  const { data: withdrawals } = usePendingWithdrawals();
  const { data: users } = useAllUsers();
  const { data: paymentNumbers } = useAllPaymentNumbers();
  const { data: stats } = usePlatformStats();
  const { data: emergencyMessages } = useAllEmergencyMessages();
  const { data: marketNews } = useAllMarketNews();
  const { data: notices } = useAllNotices();
  const { data: platformSettings } = usePlatformSettings();
  const { data: suspiciousActivities } = useSuspiciousActivities();
  const { data: allProducts } = useAllProducts();
  const approveDeposit = useApproveDeposit();
  const processWithdrawal = useProcessWithdrawal();
  const updateBalance = useUpdateUserBalance();
  const addNumber = useAddPaymentNumber();
  const toggleNumber = useTogglePaymentNumber();
  const deleteNumber = useDeletePaymentNumber();
  const createEmergency = useCreateEmergencyMessage();
  const toggleEmergency = useToggleEmergencyMessage();
  const createNews = useCreateMarketNews();
  const toggleNews = useToggleMarketNews();
  const deleteNews = useDeleteMarketNews();
  const createNotice = useCreateNotice();
  const toggleNotice = useToggleNotice();
  const deleteNotice = useDeleteNotice();
  const deleteUser = useDeleteUser();
  const updateSetting = useUpdatePlatformSetting();
  const uploadImage = useUploadImage();
  const deleteEmergency = useDeleteEmergencyMessage();
  const resetAllData = useResetAllData();
  const resolveActivity = useResolveSuspiciousActivity();
  const toggleProduct = useToggleProduct();
  const { toast } = useToast();

  const [searchUser, setSearchUser] = useState("");
  const [userPage, setUserPage] = useState(0);
  const [newPhone, setNewPhone] = useState("");
  const [newPhoneName, setNewPhoneName] = useState("InvesterMate");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // Community link state
  const [communityUrl, setCommunityUrl] = useState("");
  const [communityName, setCommunityName] = useState("Community Groups");
  
  // Emergency message state
  const [newEmergencyTitle, setNewEmergencyTitle] = useState("");
  const [newEmergencyMessage, setNewEmergencyMessage] = useState("");
  const [newEmergencyImage, setNewEmergencyImage] = useState("");
  
  // Market news state
  const [newNewsTitle, setNewNewsTitle] = useState("");
  const [newNewsDescription, setNewNewsDescription] = useState("");
  const [newNewsImageUrl, setNewNewsImageUrl] = useState("");
  const [uploadingNewsImage, setUploadingNewsImage] = useState(false);
  
  // Notice state
  const [newNoticeTitle, setNewNoticeTitle] = useState("");
  const [newNoticeMessage, setNewNoticeMessage] = useState("");
  const [newNoticeType, setNewNoticeType] = useState("info");
  
  // Maintenance message state
  const [maintenanceMessage, setMaintenanceMessage] = useState("");
  const [maintenanceEndTime, setMaintenanceEndTime] = useState("");
  
  // Overlay message state
  const [overlayMessage, setOverlayMessage] = useState("");
  const [overlayEndTime, setOverlayEndTime] = useState("");
  const [overlayActive, setOverlayActive] = useState(false);
  
  // WhatsApp support number state
  const [whatsappNumber, setWhatsappNumber] = useState("");

  // Get freeze status
  const depositsFrozen = platformSettings?.find(s => s.key === "deposits_frozen")?.value?.frozen ?? false;
  const withdrawalsFrozen = platformSettings?.find(s => s.key === "withdrawals_frozen")?.value?.frozen ?? false;
  
  // Get current WhatsApp number from settings
  const currentWhatsappNumber = platformSettings?.find(s => s.key === "whatsapp_support")?.value?.whatsapp_number || "";

  // User pagination
  const USERS_PER_PAGE = 20;

  if (checkingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const pendingDeposits = deposits?.filter((d) => d.status === "pending") || [];
  const approvedDeposits = deposits?.filter((d) => d.status === "approved") || [];
  const pendingWithdrawals = withdrawals?.filter((w) => w.status === "pending") || [];
  const completedWithdrawals = withdrawals?.filter((w) => w.status === "completed") || [];

  const totalDeposits = deposits?.length || 0;
  const depositApprovalRate = totalDeposits > 0 ? (approvedDeposits.length / totalDeposits) * 100 : 0;
  const totalWithdrawals = withdrawals?.length || 0;
  const withdrawalCompletionRate = totalWithdrawals > 0 ? (completedWithdrawals.length / totalWithdrawals) * 100 : 0;

  const filteredUsers = users?.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.phone?.includes(searchUser)
  );

  const totalFilteredUsers = filteredUsers?.length || 0;
  const paginatedUsers = filteredUsers?.slice(userPage * USERS_PER_PAGE, (userPage + 1) * USERS_PER_PAGE);
  const totalPages = Math.ceil(totalFilteredUsers / USERS_PER_PAGE);

  const handleApproveDeposit = async (id: string, approve: boolean) => {
    try {
      await approveDeposit.mutateAsync({ depositId: id, approve });
      toast({
        title: approve ? "Deposit approved" : "Deposit rejected",
        description: approve ? "Funds have been added to user's wallet" : "Deposit has been rejected",
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to process deposit" });
    }
  };

  const handleProcessWithdrawal = async (id: string, approve: boolean) => {
    try {
      await processWithdrawal.mutateAsync({ withdrawalId: id, approve });
      toast({
        title: approve ? "Withdrawal processed" : "Withdrawal rejected",
        description: approve ? "Funds have been sent" : "Funds returned to wallet",
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to process withdrawal" });
    }
  };

  const handleAddNumber = async () => {
    if (!newPhone) return;
    try {
      await addNumber.mutateAsync({ phone: newPhone, name: newPhoneName });
      toast({ title: "Number added", description: "Payment number has been added" });
      setNewPhone("");
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to add number" });
    }
  };

  const handleAdjustBalance = async () => {
    if (!selectedUser || !adjustAmount || !adjustReason) return;
    try {
      await updateBalance.mutateAsync({
        userId: selectedUser.user_id,
        amount: Number(adjustAmount),
        reason: adjustReason,
      });
      toast({ title: "Balance adjusted", description: "User balance has been updated" });
      setSelectedUser(null);
      setAdjustAmount("");
      setAdjustReason("");
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to adjust balance" });
    }
  };

  const handleCreateEmergency = async () => {
    if (!newEmergencyTitle || !newEmergencyMessage) return;
    try {
      await createEmergency.mutateAsync({
        title: newEmergencyTitle,
        message: newEmergencyMessage,
        imageUrl: newEmergencyImage || undefined,
      });
      toast({ title: "Emergency message created", description: "Message is now visible to all users" });
      setNewEmergencyTitle("");
      setNewEmergencyMessage("");
      setNewEmergencyImage("");
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create message" });
    }
  };

  const handleCreateNews = async () => {
    if (!newNewsTitle || !newNewsDescription) return;
    try {
      await createNews.mutateAsync({
        title: newNewsTitle,
        description: newNewsDescription,
        imageUrl: newNewsImageUrl || undefined,
      });
      toast({ title: "News created", description: "Market news has been published" });
      setNewNewsTitle("");
      setNewNewsDescription("");
      setNewNewsImageUrl("");
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create news" });
    }
  };

  const handleNewsImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploadingNewsImage(true);
    try {
      const { publicUrl } = await uploadImage.mutateAsync({ file, bucket: "market-news" });
      setNewNewsImageUrl(publicUrl);
      toast({ title: "Image uploaded", description: "Image ready to use" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to upload image" });
    } finally {
      setUploadingNewsImage(false);
    }
  };

  const handleCreateNotice = async () => {
    if (!newNoticeTitle || !newNoticeMessage) return;
    try {
      await createNotice.mutateAsync({
        title: newNoticeTitle,
        message: newNoticeMessage,
        type: newNoticeType,
      });
      toast({ title: "Notice created", description: "Notice has been published" });
      setNewNoticeTitle("");
      setNewNoticeMessage("");
      setNewNoticeType("info");
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to create notice" });
    }
  };

  const handleToggleFreeze = async (type: "deposits" | "withdrawals", freeze: boolean) => {
    try {
      await updateSetting.mutateAsync({
        key: `${type}_frozen`,
        value: { frozen: freeze },
      });
      toast({
        title: freeze ? `${type} frozen` : `${type} unfrozen`,
        description: freeze ? `All ${type} are now paused` : `${type} are now active`,
      });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update setting" });
    }
  };

  const handleSetMaintenance = async () => {
    try {
      await updateSetting.mutateAsync({
        key: "maintenance_message",
        value: { 
          message: maintenanceMessage || null, 
          end_time: maintenanceEndTime || null 
        },
      });
      toast({
        title: maintenanceMessage ? "Maintenance message set" : "Maintenance message cleared",
        description: maintenanceMessage ? "Users will see this message" : "No maintenance message active",
      });
      setMaintenanceMessage("");
      setMaintenanceEndTime("");
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update maintenance message" });
    }
  };

  const handleDeletePaymentNumber = async (id: string) => {
    try {
      await deleteNumber.mutateAsync({ id });
      toast({ title: "Number deleted", description: "Payment number has been removed" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete number" });
    }
  };

  const handleDeleteEmergency = async (id: string) => {
    try {
      await deleteEmergency.mutateAsync({ id });
      toast({ title: "Alert deleted", description: "Emergency message has been removed" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete alert" });
    }
  };

  const handleDeleteNews = async (id: string) => {
    try {
      await deleteNews.mutateAsync({ id });
      toast({ title: "News deleted", description: "Market news has been removed" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete news" });
    }
  };

  const handleDeleteNotice = async (id: string) => {
    try {
      await deleteNotice.mutateAsync({ id });
      toast({ title: "Notice deleted", description: "Notice has been removed" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete notice" });
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      await deleteUser.mutateAsync({ userId });
      toast({ title: "User deleted", description: "User account has been permanently removed" });
    } catch (error) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete user" });
    }
  };

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="px-4 py-4 max-w-4xl mx-auto flex items-center gap-3">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <Shield className="w-6 h-6 text-primary" />
          <h1 className="font-display font-bold text-lg">Admin Dashboard</h1>
        </div>
      </header>

      <main className="px-4 py-6 max-w-4xl mx-auto space-y-6">
        {/* Freeze Controls */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-4"
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <PauseCircle className="w-5 h-5 text-destructive" />
            Platform Controls
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <TrendingUp className={`w-4 h-4 ${depositsFrozen ? "text-destructive" : "text-profit"}`} />
                <span className="text-sm font-medium">Deposits</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${depositsFrozen ? "text-destructive" : "text-profit"}`}>
                  {depositsFrozen ? "Frozen" : "Active"}
                </span>
                <Switch
                  checked={!depositsFrozen}
                  onCheckedChange={(checked) => handleToggleFreeze("deposits", !checked)}
                  disabled={updateSetting.isPending}
                />
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-2">
                <TrendingDown className={`w-4 h-4 ${withdrawalsFrozen ? "text-destructive" : "text-profit"}`} />
                <span className="text-sm font-medium">Withdrawals</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs ${withdrawalsFrozen ? "text-destructive" : "text-profit"}`}>
                  {withdrawalsFrozen ? "Frozen" : "Active"}
                </span>
                <Switch
                  checked={!withdrawalsFrozen}
                  onCheckedChange={(checked) => handleToggleFreeze("withdrawals", !checked)}
                  disabled={updateSetting.isPending}
                />
              </div>
            </div>
          </div>
          
          {/* Maintenance Message */}
          <div className="mt-4 p-3 rounded-lg bg-muted/30 space-y-3">
            <div className="flex items-center gap-2">
              <Timer className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium">Maintenance Message</span>
            </div>
            <Input
              placeholder="Maintenance message for users..."
              value={maintenanceMessage}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
            />
            <div className="flex gap-2">
              <Input
                type="datetime-local"
                value={maintenanceEndTime}
                onChange={(e) => setMaintenanceEndTime(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSetMaintenance} disabled={updateSetting.isPending}>
                Set
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setMaintenanceMessage("");
                  setMaintenanceEndTime("");
                  updateSetting.mutate({
                    key: "maintenance_message",
                    value: { message: null, end_time: null },
                  });
                }}
                disabled={updateSetting.isPending}
              >
                Clear
              </Button>
            </div>
          </div>
          
          {/* Community Link */}
          <div className="mt-4 p-3 rounded-lg bg-muted/30 space-y-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Community Groups Link</span>
            </div>
            <Input
              placeholder="Group name (e.g. 'WhatsApp Community')"
              value={communityName}
              onChange={(e) => setCommunityName(e.target.value)}
            />
            <div className="flex gap-2">
              <Input
                placeholder="https://chat.whatsapp.com/..."
                value={communityUrl}
                onChange={(e) => setCommunityUrl(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={() => {
                  updateSetting.mutate({
                    key: "community_link",
                    value: { url: communityUrl, name: communityName },
                  });
                  toast({ title: "Community link updated" });
                }}
                disabled={updateSetting.isPending}
              >
                Save
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setCommunityUrl("");
                  setCommunityName("Community Groups");
                  updateSetting.mutate({
                    key: "community_link",
                    value: { url: null, name: null },
                  });
                }}
                disabled={updateSetting.isPending}
              >
                Clear
              </Button>
            </div>
          </div>
          
          {/* Overlay Message (Full Screen Message) */}
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 space-y-3">
            <div className="flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">Full-Screen Overlay Message</span>
            </div>
            <p className="text-xs text-muted-foreground">
              This message will overlay the entire app with a countdown timer
            </p>
            <Input
              placeholder="Important message to display..."
              value={overlayMessage}
              onChange={(e) => setOverlayMessage(e.target.value)}
            />
            <div className="flex gap-2">
              <Input
                type="datetime-local"
                value={overlayEndTime}
                onChange={(e) => setOverlayEndTime(e.target.value)}
                className="flex-1"
              />
              <Button 
                variant={overlayActive ? "destructive" : "default"}
                onClick={() => {
                  const newActive = !overlayActive;
                  setOverlayActive(newActive);
                  updateSetting.mutate({
                    key: "overlay_message",
                    value: { 
                      message: overlayMessage || null, 
                      end_time: overlayEndTime || null,
                      is_active: newActive
                    },
                  });
                  toast({ 
                    title: newActive ? "Overlay activated" : "Overlay deactivated",
                    description: newActive ? "Users will see the overlay message" : "Overlay has been hidden"
                  });
                }}
                disabled={updateSetting.isPending}
              >
                {overlayActive ? "Deactivate" : "Activate"}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setOverlayMessage("");
                  setOverlayEndTime("");
                  setOverlayActive(false);
                  updateSetting.mutate({
                    key: "overlay_message",
                    value: { message: null, end_time: null, is_active: false },
                  });
                  toast({ title: "Overlay cleared" });
                }}
                disabled={updateSetting.isPending}
              >
                Clear
              </Button>
            </div>
          </div>
          
          {/* WhatsApp Support Number */}
          <div className="mt-4 p-3 rounded-lg bg-muted/30 space-y-3">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">WhatsApp Support Number</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Current: {currentWhatsappNumber || "Not set (using default)"}
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="+254 7XX XXX XXX"
                value={whatsappNumber}
                onChange={(e) => setWhatsappNumber(e.target.value)}
                className="flex-1"
              />
              <Button 
                onClick={() => {
                  updateSetting.mutate({
                    key: "whatsapp_support",
                    value: { whatsapp_number: whatsappNumber },
                  });
                  toast({ title: "WhatsApp number updated" });
                }}
                disabled={updateSetting.isPending}
              >
                Save
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setWhatsappNumber("");
                  updateSetting.mutate({
                    key: "whatsapp_support",
                    value: { whatsapp_number: null },
                  });
                }}
                disabled={updateSetting.isPending}
              >
                Clear
              </Button>
            </div>
          </div>
          
          {/* Reset All Data */}
          <div className="mt-4 p-3 rounded-lg bg-destructive/10 border border-destructive/20 space-y-3">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium text-destructive">Reset All Data</span>
            </div>
            <p className="text-xs text-muted-foreground">
              This will clear all deposits, withdrawals, transactions, investments and reset all wallet balances to 0.
            </p>
            <Button 
              variant="destructive"
              onClick={() => {
                if (confirm("⚠️ WARNING: This will permanently delete ALL deposits, withdrawals, transactions, investments and reset ALL wallet balances to 0. This action CANNOT be undone. Are you absolutely sure?")) {
                  resetAllData.mutate(undefined, {
                    onSuccess: () => toast({ title: "All data has been reset" }),
                  });
                }
              }}
              disabled={resetAllData.isPending}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Reset Everything
            </Button>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-5 h-5 text-primary" />
              <span className="text-sm text-muted-foreground">Users</span>
            </div>
            <p className="text-2xl font-bold">{stats?.totalUsers || 0}</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5 text-profit" />
              <span className="text-sm text-muted-foreground">Deposits</span>
            </div>
            <p className="text-2xl font-bold">KES {((stats?.totalDeposits || 0) / 1000).toFixed(0)}K</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-card p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-5 h-5 text-destructive" />
              <span className="text-sm text-muted-foreground">Withdrawals</span>
            </div>
            <p className="text-2xl font-bold">KES {((stats?.totalWithdrawals || 0) / 1000).toFixed(0)}K</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`glass-card p-4 ${(stats?.cashFlow || 0) >= 0 ? "border-profit/30" : "border-destructive/30"}`}
          >
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-5 h-5 text-trust" />
              <span className="text-sm text-muted-foreground">Cash Flow</span>
            </div>
            <p className={`text-2xl font-bold ${(stats?.cashFlow || 0) >= 0 ? "text-profit" : "text-destructive"}`}>
              KES {((stats?.cashFlow || 0) / 1000).toFixed(0)}K
            </p>
          </motion.div>
        </div>

        {/* Percentage Bars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-profit" />
                <span className="text-sm font-medium">Deposit Approval Rate</span>
              </div>
              <span className="text-sm font-bold text-profit">{depositApprovalRate.toFixed(0)}%</span>
            </div>
            <Progress value={depositApprovalRate} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {approvedDeposits.length} approved / {totalDeposits} total
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-trust" />
                <span className="text-sm font-medium">Withdrawal Completion Rate</span>
              </div>
              <span className="text-sm font-bold text-trust">{withdrawalCompletionRate.toFixed(0)}%</span>
            </div>
            <Progress value={withdrawalCompletionRate} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1">
              {completedWithdrawals.length} completed / {totalWithdrawals} total
            </p>
          </motion.div>
        </div>

        {/* Alert for pending */}
        {(pendingDeposits.length > 0 || pendingWithdrawals.length > 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center gap-3"
          >
            <AlertTriangle className="w-6 h-6 text-yellow-500" />
            <div>
              <p className="font-semibold text-yellow-500">Pending Actions Required</p>
              <p className="text-sm text-muted-foreground">
                {pendingDeposits.length} deposits, {pendingWithdrawals.length} withdrawals awaiting review
              </p>
            </div>
          </motion.div>
        )}

        <Tabs defaultValue="deposits" className="w-full">
          <TabsList className="grid w-full grid-cols-9 text-xs">
            <TabsTrigger value="deposits">Deposits</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="messages">Alerts</TabsTrigger>
            <TabsTrigger value="news">News</TabsTrigger>
            <TabsTrigger value="notices">Notices</TabsTrigger>
            <TabsTrigger value="numbers">Numbers</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="deposits" className="space-y-4">
            {pendingDeposits.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No pending deposits</p>
            ) : (
              pendingDeposits.map((deposit: any) => (
                <div key={deposit.id} className="glass-card p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">KES {Number(deposit.amount).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">
                      {deposit.profiles?.full_name || deposit.profiles?.email || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      From: {deposit.phone_number} • {deposit.mpesa_code || "No code"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(deposit.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-destructive text-destructive"
                      onClick={() => handleApproveDeposit(deposit.id, false)}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      className="bg-profit hover:bg-profit/90"
                      onClick={() => handleApproveDeposit(deposit.id, true)}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="withdrawals" className="space-y-4">
            {pendingWithdrawals.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No pending withdrawals</p>
            ) : (
              pendingWithdrawals.map((withdrawal: any) => (
                <div key={withdrawal.id} className="glass-card p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold">KES {Number(withdrawal.amount).toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">
                      {withdrawal.profiles?.full_name || withdrawal.profiles?.email || "Unknown"}
                    </p>
                    <p className="text-xs text-muted-foreground">To: {withdrawal.phone_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(withdrawal.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-destructive text-destructive"
                      onClick={() => handleProcessWithdrawal(withdrawal.id, false)}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      className="bg-profit hover:bg-profit/90"
                      onClick={() => handleProcessWithdrawal(withdrawal.id, true)}
                    >
                      <CheckCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchUser}
                onChange={(e) => setSearchUser(e.target.value)}
                className="pl-10"
              />
            </div>

            {paginatedUsers?.map((user: any) => (
              <div key={user.id} className="glass-card p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold truncate">{user.full_name || "No name"}</p>
                      {user.user_levels?.[0] && (
                        <Badge variant="secondary" className="text-xs">
                          Lv.{user.user_levels[0].current_level}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                    <p className="text-xs text-muted-foreground">{user.phone || "No phone"}</p>
                    
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                        <Award className="w-3 h-3 inline mr-1" />
                        {user.badges_count || 0} badges
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-profit/20 text-profit">
                        {user.active_investments_count || 0} investments
                      </span>
                      {(user.pending_deposits_count || 0) > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-500">
                          {user.pending_deposits_count} pending deposits
                        </span>
                      )}
                      {(user.pending_withdrawals_count || 0) > 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-500">
                          {user.pending_withdrawals_count} pending withdrawals
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-profit">
                      KES {Number(user.wallets?.[0]?.balance || 0).toLocaleString()}
                    </p>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Wallet className="w-4 h-4 mr-1" /> Adjust
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Adjust Balance - {user.full_name || user.email}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label>Current Balance</Label>
                            <p className="text-2xl font-bold">
                              KES {Number(user.wallets?.[0]?.balance || 0).toLocaleString()}
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label>Adjustment Amount (+/-)</Label>
                            <Input
                              type="number"
                              placeholder="e.g. 1000 or -500"
                              value={adjustAmount}
                              onChange={(e) => setAdjustAmount(e.target.value)}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Reason</Label>
                            <Input
                              placeholder="Reason for adjustment"
                              value={adjustReason}
                              onChange={(e) => setAdjustReason(e.target.value)}
                            />
                          </div>
                          <Button
                            className="w-full"
                            onClick={handleAdjustBalance}
                            disabled={!adjustAmount || !adjustReason || updateBalance.isPending}
                          >
                            Apply Adjustment
                          </Button>
                          <Button
                            variant="destructive"
                            className="w-full mt-2"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${user.full_name || user.email}? This action cannot be undone.`)) {
                                handleDeleteUser(user.user_id);
                              }
                            }}
                            disabled={deleteUser.isPending}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete User
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4">
                <p className="text-sm text-muted-foreground">
                  Showing {userPage * USERS_PER_PAGE + 1}-{Math.min((userPage + 1) * USERS_PER_PAGE, totalFilteredUsers)} of {totalFilteredUsers}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUserPage(p => Math.max(0, p - 1))}
                    disabled={userPage === 0}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUserPage(p => Math.min(totalPages - 1, p + 1))}
                    disabled={userPage >= totalPages - 1}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="messages" className="space-y-4">
            <div className="glass-card p-4 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Create Emergency Message
              </h3>
              <div className="space-y-3">
                <Input
                  placeholder="Title"
                  value={newEmergencyTitle}
                  onChange={(e) => setNewEmergencyTitle(e.target.value)}
                />
                <Textarea
                  placeholder="Message content..."
                  value={newEmergencyMessage}
                  onChange={(e) => setNewEmergencyMessage(e.target.value)}
                  rows={3}
                />
                <Input
                  placeholder="Image URL (optional)"
                  value={newEmergencyImage}
                  onChange={(e) => setNewEmergencyImage(e.target.value)}
                />
                <Button 
                  onClick={handleCreateEmergency} 
                  disabled={!newEmergencyTitle || !newEmergencyMessage || createEmergency.isPending}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Publish Message
                </Button>
              </div>
            </div>

            {emergencyMessages?.map((msg: any) => (
              <div key={msg.id} className="glass-card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${msg.is_active ? 'bg-profit' : 'bg-muted'}`} />
                      <h4 className="font-semibold">{msg.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{msg.message}</p>
                    {msg.image_url && (
                      <img 
                        src={msg.image_url} 
                        alt={msg.title} 
                        className="mt-2 rounded-lg max-h-20 object-cover"
                      />
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant={msg.is_active ? "default" : "outline"}
                      onClick={() => toggleEmergency.mutate({ id: msg.id, isActive: !msg.is_active })}
                    >
                      {msg.is_active ? "Active" : "Inactive"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-destructive text-destructive"
                      onClick={() => handleDeleteEmergency(msg.id)}
                      disabled={deleteEmergency.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="news" className="space-y-4">
            <div className="glass-card p-4 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Newspaper className="w-4 h-4" />
                Create Market News
              </h3>
              <div className="space-y-3">
                <Input
                  placeholder="News Title"
                  value={newNewsTitle}
                  onChange={(e) => setNewNewsTitle(e.target.value)}
                />
                <Textarea
                  placeholder="News description..."
                  value={newNewsDescription}
                  onChange={(e) => setNewNewsDescription(e.target.value)}
                  rows={3}
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="Image URL (or upload)"
                    value={newNewsImageUrl}
                    onChange={(e) => setNewNewsImageUrl(e.target.value)}
                    className="flex-1"
                  />
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleNewsImageUpload}
                      disabled={uploadingNewsImage}
                    />
                    <Button type="button" variant="outline" disabled={uploadingNewsImage} asChild>
                      <span>
                        {uploadingNewsImage ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                      </span>
                    </Button>
                  </label>
                </div>
                {newNewsImageUrl && (
                  <img src={newNewsImageUrl} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
                )}
                <Button 
                  onClick={handleCreateNews} 
                  disabled={!newNewsTitle || !newNewsDescription || createNews.isPending}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Publish News
                </Button>
              </div>
            </div>

            {marketNews?.map((news: any) => (
              <div key={news.id} className="glass-card p-4">
                <div className="flex items-start justify-between gap-4">
                  {news.image_url && (
                    <img 
                      src={news.image_url} 
                      alt={news.title} 
                      className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${news.is_active ? 'bg-profit' : 'bg-muted'}`} />
                      <h4 className="font-semibold truncate">{news.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{news.description}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(news.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant={news.is_active ? "default" : "outline"}
                      onClick={() => toggleNews.mutate({ id: news.id, isActive: !news.is_active })}
                    >
                      {news.is_active ? "Active" : "Inactive"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-destructive text-destructive"
                      onClick={() => handleDeleteNews(news.id)}
                      disabled={deleteNews.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="notices" className="space-y-4">
            <div className="glass-card p-4 space-y-4">
              <h3 className="font-semibold flex items-center gap-2">
                <Bell className="w-4 h-4" />
                Create Notice
              </h3>
              <div className="space-y-3">
                <Input
                  placeholder="Notice Title"
                  value={newNoticeTitle}
                  onChange={(e) => setNewNoticeTitle(e.target.value)}
                />
                <Textarea
                  placeholder="Notice message..."
                  value={newNoticeMessage}
                  onChange={(e) => setNewNoticeMessage(e.target.value)}
                  rows={3}
                />
                <Select value={newNoticeType} onValueChange={setNewNoticeType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="info">Info</SelectItem>
                    <SelectItem value="important">Important</SelectItem>
                    <SelectItem value="update">Update</SelectItem>
                  </SelectContent>
                </Select>
                <Button 
                  onClick={handleCreateNotice} 
                  disabled={!newNoticeTitle || !newNoticeMessage || createNotice.isPending}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Publish Notice
                </Button>
              </div>
            </div>

            {notices?.map((notice: any) => (
              <div key={notice.id} className="glass-card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-2 h-2 rounded-full ${notice.is_active ? 'bg-profit' : 'bg-muted'}`} />
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        notice.type === 'important' ? 'bg-yellow-500/20 text-yellow-500' :
                        notice.type === 'update' ? 'bg-blue-500/20 text-blue-500' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {notice.type}
                      </span>
                      <h4 className="font-semibold">{notice.title}</h4>
                    </div>
                    <p className="text-sm text-muted-foreground">{notice.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notice.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant={notice.is_active ? "default" : "outline"}
                      onClick={() => toggleNotice.mutate({ id: notice.id, isActive: !notice.is_active })}
                    >
                      {notice.is_active ? "Active" : "Inactive"}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-destructive text-destructive"
                      onClick={() => handleDeleteNotice(notice.id)}
                      disabled={deleteNotice.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="numbers" className="space-y-4">
            <div className="glass-card p-4 space-y-4">
              <h3 className="font-semibold">Add New Payment Number</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Phone number"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                />
                <Input
                  placeholder="Account name"
                  value={newPhoneName}
                  onChange={(e) => setNewPhoneName(e.target.value)}
                />
                <Button onClick={handleAddNumber} disabled={!newPhone}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {paymentNumbers?.map((num: any) => (
              <div key={num.id} className="glass-card p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {num.phone_number}
                  </p>
                  <p className="text-sm text-muted-foreground">{num.account_name}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={num.is_active ? "default" : "outline"}
                    onClick={() => toggleNumber.mutate({ id: num.id, isActive: !num.is_active })}
                  >
                    {num.is_active ? "Active" : "Inactive"}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-destructive text-destructive"
                    onClick={() => handleDeletePaymentNumber(num.id)}
                    disabled={deleteNumber.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <div className="glass-card p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Package className="w-5 h-5 text-primary" />
                Product Management
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Toggle products on/off to control which investments are available to users.
              </p>
            </div>

            {allProducts?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No products found</p>
            ) : (
              allProducts?.map((product: any) => (
                <div key={product.id} className={`glass-card p-4 ${!product.is_active ? 'opacity-60' : ''}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${product.is_active ? 'bg-profit' : 'bg-muted'}`} />
                        <h4 className="font-semibold">{product.name}</h4>
                        {product.is_popular && (
                          <Badge variant="secondary">Popular</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>KES {Number(product.price).toLocaleString()}</span>
                        <span>{product.expected_return}% return</span>
                        <span>{product.duration_days} days</span>
                        <span className="text-xs">{product.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${product.is_active ? 'text-profit' : 'text-muted-foreground'}`}>
                        {product.is_active ? 'Live' : 'Closed'}
                      </span>
                      <Switch
                        checked={product.is_active}
                        onCheckedChange={(checked) => {
                          toggleProduct.mutate({ id: product.id, isActive: checked }, {
                            onSuccess: () => {
                              toast({
                                title: checked ? "Product activated" : "Product deactivated",
                                description: checked ? "Product is now available for investment" : "Product is no longer available",
                              });
                            },
                          });
                        }}
                        disabled={toggleProduct.isPending}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <div className="glass-card p-4">
              <h3 className="font-semibold flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-destructive" />
                Suspicious Activity Log
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Real-time security monitoring with IP, browser, and device tracking.
              </p>
            </div>

            {suspiciousActivities?.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No suspicious activities detected</p>
            ) : (
              suspiciousActivities?.map((activity: any) => (
                <div key={activity.id} className={`glass-card p-4 ${activity.resolved ? 'opacity-50' : ''} ${activity.severity === 'high' || activity.severity === 'critical' ? 'border-destructive/50' : ''}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant={activity.severity === 'high' || activity.severity === 'critical' ? 'destructive' : activity.severity === 'medium' ? 'secondary' : 'outline'}>
                          {activity.severity}
                        </Badge>
                        <span className="font-medium">{activity.action}</span>
                        {activity.resolved && <Badge variant="outline">Resolved</Badge>}
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <p><Globe className="w-3 h-3 inline mr-1" />IP: {activity.ip_address || 'Unknown'}</p>
                        <p><Monitor className="w-3 h-3 inline mr-1" />{activity.browser} / {activity.device}</p>
                        <p>{formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}</p>
                      </div>
                    </div>
                    {!activity.resolved && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveActivity.mutate({ id: activity.id })}
                        disabled={resolveActivity.isPending}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Resolve
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
