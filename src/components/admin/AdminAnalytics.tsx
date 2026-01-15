import { motion } from "framer-motion";
import { AlertTriangle, TrendingDown, TrendingUp, Users, AlertCircle, DollarSign } from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { usePendingDeposits, usePendingWithdrawals, useAllUsers } from "@/hooks/useAdmin";
import { useMemo } from "react";
import { subDays, format, parseISO, startOfDay } from "date-fns";

interface CriticalAlert {
  type: "critical" | "warning" | "info";
  title: string;
  message: string;
  icon: typeof AlertTriangle;
}

export const AdminAnalytics = () => {
  const { data: deposits } = usePendingDeposits();
  const { data: withdrawals } = usePendingWithdrawals();
  const { data: users } = useAllUsers();

  // Calculate money flow data for last 7 days
  const moneyFlowData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date: format(date, "MMM dd"),
        dateKey: format(date, "yyyy-MM-dd"),
        deposits: 0,
        withdrawals: 0,
      };
    });

    // Sum deposits by day
    deposits?.forEach((d) => {
      if (d.status === "approved") {
        const dayKey = format(startOfDay(parseISO(d.created_at)), "yyyy-MM-dd");
        const dayData = last7Days.find((day) => day.dateKey === dayKey);
        if (dayData) {
          dayData.deposits += Number(d.amount);
        }
      }
    });

    // Sum withdrawals by day
    withdrawals?.forEach((w) => {
      if (w.status === "completed") {
        const dayKey = format(startOfDay(parseISO(w.created_at)), "yyyy-MM-dd");
        const dayData = last7Days.find((day) => day.dateKey === dayKey);
        if (dayData) {
          dayData.withdrawals += Number(w.amount);
        }
      }
    });

    return last7Days;
  }, [deposits, withdrawals]);

  // Calculate user registration data for last 7 days
  const userRegistrationData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return {
        date: format(date, "MMM dd"),
        dateKey: format(date, "yyyy-MM-dd"),
        registrations: 0,
      };
    });

    users?.forEach((u) => {
      const dayKey = format(startOfDay(parseISO(u.created_at)), "yyyy-MM-dd");
      const dayData = last7Days.find((day) => day.dateKey === dayKey);
      if (dayData) {
        dayData.registrations += 1;
      }
    });

    return last7Days;
  }, [users]);

  // Calculate pie chart data
  const transactionStatusData = useMemo(() => {
    const pendingDeposits = deposits?.filter((d) => d.status === "pending").length || 0;
    const approvedDeposits = deposits?.filter((d) => d.status === "approved").length || 0;
    const rejectedDeposits = deposits?.filter((d) => d.status === "rejected").length || 0;
    
    return [
      { name: "Pending", value: pendingDeposits, color: "hsl(var(--warning))" },
      { name: "Approved", value: approvedDeposits, color: "hsl(var(--profit))" },
      { name: "Rejected", value: rejectedDeposits, color: "hsl(var(--destructive))" },
    ].filter((d) => d.value > 0);
  }, [deposits]);

  const withdrawalStatusData = useMemo(() => {
    const pendingWithdrawals = withdrawals?.filter((w) => w.status === "pending").length || 0;
    const completedWithdrawals = withdrawals?.filter((w) => w.status === "completed").length || 0;
    const rejectedWithdrawals = withdrawals?.filter((w) => w.status === "rejected").length || 0;
    
    return [
      { name: "Pending", value: pendingWithdrawals, color: "hsl(var(--warning))" },
      { name: "Completed", value: completedWithdrawals, color: "hsl(var(--profit))" },
      { name: "Rejected", value: rejectedWithdrawals, color: "hsl(var(--destructive))" },
    ].filter((d) => d.value > 0);
  }, [withdrawals]);

  // Generate critical alerts
  const criticalAlerts = useMemo(() => {
    const alerts: CriticalAlert[] = [];
    
    // Calculate totals
    const totalDeposits = moneyFlowData.reduce((sum, d) => sum + d.deposits, 0);
    const totalWithdrawals = moneyFlowData.reduce((sum, d) => sum + d.withdrawals, 0);
    
    // Alert: Withdrawals approaching or exceeding deposits
    if (totalDeposits > 0) {
      const withdrawalRatio = totalWithdrawals / totalDeposits;
      if (withdrawalRatio >= 1) {
        alerts.push({
          type: "critical",
          title: "Critical: Withdrawals Exceed Deposits",
          message: `Withdrawals (KES ${totalWithdrawals.toLocaleString()}) have exceeded deposits (KES ${totalDeposits.toLocaleString()}) in the last 7 days!`,
          icon: AlertTriangle,
        });
      } else if (withdrawalRatio >= 0.8) {
        alerts.push({
          type: "warning",
          title: "Warning: High Withdrawal Rate",
          message: `Withdrawals are at ${(withdrawalRatio * 100).toFixed(0)}% of deposits. Monitor closely.`,
          icon: TrendingDown,
        });
      }
    }

    // Alert: Declining user registrations
    const recentRegistrations = userRegistrationData.slice(-3).reduce((sum, d) => sum + d.registrations, 0);
    const earlierRegistrations = userRegistrationData.slice(0, 4).reduce((sum, d) => sum + d.registrations, 0);
    
    if (earlierRegistrations > 0 && recentRegistrations < earlierRegistrations * 0.5) {
      alerts.push({
        type: "warning",
        title: "Warning: User Registration Decline",
        message: `New user registrations have dropped by ${((1 - recentRegistrations / earlierRegistrations) * 100).toFixed(0)}% compared to earlier this week.`,
        icon: Users,
      });
    }

    // Alert: Zero registrations in last 2 days
    const last2DaysReg = userRegistrationData.slice(-2).reduce((sum, d) => sum + d.registrations, 0);
    if (last2DaysReg === 0 && users && users.length > 0) {
      alerts.push({
        type: "info",
        title: "Notice: No New Registrations",
        message: "No new users have registered in the last 2 days.",
        icon: Users,
      });
    }

    // Alert: Pending transactions pile-up
    const pendingDeposits = deposits?.filter((d) => d.status === "pending").length || 0;
    const pendingWithdrawals = withdrawals?.filter((w) => w.status === "pending").length || 0;
    
    if (pendingDeposits > 10 || pendingWithdrawals > 10) {
      alerts.push({
        type: "warning",
        title: "Pending Transactions Backlog",
        message: `${pendingDeposits} pending deposits and ${pendingWithdrawals} pending withdrawals need attention.`,
        icon: AlertCircle,
      });
    }

    return alerts;
  }, [moneyFlowData, userRegistrationData, deposits, withdrawals, users]);

  return (
    <div className="space-y-6">
      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <h3 className="font-semibold flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            System Alerts
          </h3>
          {criticalAlerts.map((alert, index) => (
            <Alert 
              key={index} 
              variant={alert.type === "critical" ? "destructive" : "default"}
              className={alert.type === "warning" ? "border-yellow-500/50 bg-yellow-500/10" : ""}
            >
              <alert.icon className="h-4 w-4" />
              <AlertTitle>{alert.title}</AlertTitle>
              <AlertDescription>{alert.message}</AlertDescription>
            </Alert>
          ))}
        </motion.div>
      )}

      {/* Money Flow Bar Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <DollarSign className="w-5 h-5 text-primary" />
              Money Flow (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={moneyFlowData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                  formatter={(value: number) => [`KES ${value.toLocaleString()}`, ""]}
                />
                <Legend />
                <Bar 
                  dataKey="deposits" 
                  name="Deposits" 
                  fill="hsl(var(--profit))" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="withdrawals" 
                  name="Withdrawals" 
                  fill="hsl(var(--destructive))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* User Registration Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="w-5 h-5 text-trust" />
              User Registrations (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={userRegistrationData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))", 
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Bar 
                  dataKey="registrations" 
                  name="New Users" 
                  fill="hsl(var(--trust))" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Pie Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingUp className="w-5 h-5 text-profit" />
                Deposit Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {transactionStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={transactionStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {transactionStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No deposit data
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-card/50 backdrop-blur">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <TrendingDown className="w-5 h-5 text-destructive" />
                Withdrawal Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {withdrawalStatusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={withdrawalStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {withdrawalStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: "hsl(var(--card))", 
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px"
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex items-center justify-center text-muted-foreground">
                  No withdrawal data
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};
