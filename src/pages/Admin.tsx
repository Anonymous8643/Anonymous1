import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Users, Wallet, Phone, CheckCircle, XCircle, 
  Plus, AlertTriangle, TrendingUp, TrendingDown,
  Eye, Search, ArrowLeft, Shield
} from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  usePlatformStats
} from "@/hooks/useAdmin";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import logo from "@/assets/logo.png";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function Admin() {
  const { data: isAdmin, isLoading: checkingAdmin } = useIsAdmin();
  const { data: deposits } = usePendingDeposits();
  const { data: withdrawals } = usePendingWithdrawals();
  const { data: users } = useAllUsers();
  const { data: paymentNumbers } = useAllPaymentNumbers();
  const { data: stats } = usePlatformStats();
  const approveDeposit = useApproveDeposit();
  const processWithdrawal = useProcessWithdrawal();
  const updateBalance = useUpdateUserBalance();
  const addNumber = useAddPaymentNumber();
  const toggleNumber = useTogglePaymentNumber();
  const { toast } = useToast();

  const [searchUser, setSearchUser] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPhoneName, setNewPhoneName] = useState("InvesterMate");
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);

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
  const pendingWithdrawals = withdrawals?.filter((w) => w.status === "pending") || [];

  const filteredUsers = users?.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchUser.toLowerCase()) ||
      u.phone?.includes(searchUser)
  );

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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="deposits">Deposits</TabsTrigger>
            <TabsTrigger value="withdrawals">Withdrawals</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="numbers">Numbers</TabsTrigger>
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

            {filteredUsers?.slice(0, 20).map((user: any) => (
              <div key={user.id} className="glass-card p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold">{user.full_name || "No name"}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  <p className="text-xs text-muted-foreground">{user.phone || "No phone"}</p>
                </div>
                <div className="text-right">
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
                      </div>
                    </DialogContent>
                  </Dialog>
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
                <Button
                  size="sm"
                  variant={num.is_active ? "default" : "outline"}
                  onClick={() => toggleNumber.mutate({ id: num.id, isActive: !num.is_active })}
                >
                  {num.is_active ? "Active" : "Inactive"}
                </Button>
              </div>
            ))}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
