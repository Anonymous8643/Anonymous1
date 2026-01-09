import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

// Create admin client for privileged operations
const adminClient = createClient(supabaseUrl, supabaseServiceKey);

// Helper to create user client from auth header
function createUserClient(authHeader: string | null) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader || "" } },
  });
}

// Helper to verify user and get claims
async function verifyUser(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) {
    return { user: null, error: "Unauthorized" };
  }
  const token = authHeader.replace("Bearer ", "");
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) {
    return { user: null, error: "Invalid token" };
  }
  return { user: { id: data.claims.sub as string, email: data.claims.email as string }, error: null };
}

// Check if user is admin
async function isAdmin(userId: string): Promise<boolean> {
  const { data } = await adminClient
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  return !!data;
}

// Route handlers
async function handleAuth(
  req: Request,
  action: string,
  body: Record<string, unknown>
): Promise<Response> {
  const publicClient = createClient(supabaseUrl, supabaseAnonKey);

  switch (action) {
    case "signUp": {
      const { email, password, fullName } = body as { email: string; password: string; fullName: string };
      const { data, error } = await publicClient.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ user: data.user, session: data.session });
    }
    case "signIn": {
      const { email, password } = body as { email: string; password: string };
      const { data, error } = await publicClient.auth.signInWithPassword({ email, password });
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ user: data.user, session: data.session });
    }
    case "signOut": {
      return jsonSuccess({ success: true });
    }
    case "resetPassword": {
      const { email, redirectTo } = body as { email: string; redirectTo: string };
      const { error } = await publicClient.auth.resetPasswordForEmail(email, { redirectTo });
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ success: true });
    }
    case "getSession": {
      const authHeader = req.headers.get("Authorization");
      const supabase = createUserClient(authHeader);
      const { data, error } = await supabase.auth.getSession();
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ session: data.session });
    }
    default:
      return jsonError("Invalid auth action", 400);
  }
}

async function handleProfile(
  req: Request,
  action: string,
  body: Record<string, unknown>,
  userId: string
): Promise<Response> {
  switch (action) {
    case "get": {
      const { data, error } = await adminClient
        .from("profiles")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ profile: data });
    }
    case "update": {
      const updates = body.updates as Record<string, unknown>;
      const { data, error } = await adminClient
        .from("profiles")
        .update(updates)
        .eq("user_id", userId)
        .select()
        .single();
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ profile: data });
    }
    default:
      return jsonError("Invalid profile action", 400);
  }
}

async function handleWallet(
  _req: Request,
  action: string,
  _body: Record<string, unknown>,
  userId: string
): Promise<Response> {
  switch (action) {
    case "get": {
      const { data, error } = await adminClient
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ wallet: data });
    }
    default:
      return jsonError("Invalid wallet action", 400);
  }
}

async function handleTransactions(
  _req: Request,
  action: string,
  _body: Record<string, unknown>,
  userId: string
): Promise<Response> {
  switch (action) {
    case "list": {
      const { data, error } = await adminClient
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ transactions: data });
    }
    default:
      return jsonError("Invalid transactions action", 400);
  }
}

async function handleDeposits(
  _req: Request,
  action: string,
  body: Record<string, unknown>,
  userId: string
): Promise<Response> {
  switch (action) {
    case "list": {
      const { data, error } = await adminClient
        .from("pending_deposits")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ deposits: data });
    }
    case "create": {
      const { amount, phoneNumber, mpesaCode, paymentNumberUsed } = body as {
        amount: number;
        phoneNumber: string;
        mpesaCode?: string;
        paymentNumberUsed: string;
      };
      const { data, error } = await adminClient.from("pending_deposits").insert({
        user_id: userId,
        amount,
        phone_number: phoneNumber,
        mpesa_code: mpesaCode,
        payment_number_used: paymentNumberUsed,
        status: "pending",
      }).select().single();
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ deposit: data });
    }
    default:
      return jsonError("Invalid deposits action", 400);
  }
}

async function handleWithdrawals(
  _req: Request,
  action: string,
  body: Record<string, unknown>,
  userId: string
): Promise<Response> {
  switch (action) {
    case "list": {
      const { data, error } = await adminClient
        .from("pending_withdrawals")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ withdrawals: data });
    }
    case "create": {
      const { amount, phoneNumber } = body as { amount: number; phoneNumber: string };
      
      // Get wallet and check balance
      const { data: wallet, error: walletError } = await adminClient
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .single();
      
      if (walletError) return jsonError("Wallet not found", 400);
      if (Number(wallet.balance) < amount) return jsonError("Insufficient balance", 400);
      
      // Deduct from wallet
      await adminClient
        .from("wallets")
        .update({ balance: Number(wallet.balance) - amount })
        .eq("user_id", userId);
      
      const { data, error } = await adminClient.from("pending_withdrawals").insert({
        user_id: userId,
        amount,
        phone_number: phoneNumber,
        status: "pending",
      }).select().single();
      
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ withdrawal: data });
    }
    default:
      return jsonError("Invalid withdrawals action", 400);
  }
}

async function handleProducts(
  _req: Request,
  action: string,
  _body: Record<string, unknown>
): Promise<Response> {
  switch (action) {
    case "list": {
      const { data, error } = await adminClient
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("price", { ascending: true });
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ products: data });
    }
    case "get": {
      const { id } = _body as { id: string };
      const { data, error } = await adminClient
        .from("products")
        .select("*")
        .eq("id", id)
        .single();
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ product: data });
    }
    default:
      return jsonError("Invalid products action", 400);
  }
}

async function handleInvestments(
  _req: Request,
  action: string,
  body: Record<string, unknown>,
  userId: string
): Promise<Response> {
  switch (action) {
    case "list": {
      const { data, error } = await adminClient
        .from("investments")
        .select("*, products(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ investments: data });
    }
    case "create": {
      const { productId, amount, expectedReturn, maturesAt } = body as {
        productId: string;
        amount: number;
        expectedReturn: number;
        maturesAt: string;
      };
      
      // Deduct from wallet
      const { data: wallet, error: walletError } = await adminClient
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .single();
      
      if (walletError) return jsonError("Wallet not found", 400);
      if (Number(wallet.balance) < amount) return jsonError("Insufficient balance", 400);
      
      await adminClient
        .from("wallets")
        .update({
          balance: Number(wallet.balance) - amount,
          total_invested: Number(wallet.total_invested) + amount,
          pending_returns: Number(wallet.pending_returns) + expectedReturn,
        })
        .eq("user_id", userId);
      
      const { data, error } = await adminClient.from("investments").insert({
        user_id: userId,
        product_id: productId,
        amount,
        expected_return: expectedReturn,
        matures_at: maturesAt,
        status: "active",
      }).select().single();
      
      if (error) return jsonError(error.message, 400);
      
      // Create transaction
      await adminClient.from("transactions").insert({
        user_id: userId,
        type: "investment",
        amount: -amount,
        description: `Investment purchase`,
        status: "completed",
      });
      
      return jsonSuccess({ investment: data });
    }
    case "recent": {
      // Public - for live activity feed
      const { data, error } = await adminClient
        .from("investments")
        .select("amount, expected_return, created_at, products(name)")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ investments: data });
    }
    default:
      return jsonError("Invalid investments action", 400);
  }
}

async function handlePublic(
  _req: Request,
  action: string,
  _body: Record<string, unknown>
): Promise<Response> {
  switch (action) {
    case "paymentNumbers": {
      const { data, error } = await adminClient
        .from("payment_numbers")
        .select("*")
        .eq("is_active", true)
        .order("priority", { ascending: true });
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ numbers: data });
    }
    case "notices": {
      const { data, error } = await adminClient
        .from("notices")
        .select("*")
        .eq("is_active", true)
        .or("expires_at.is.null,expires_at.gt.now()")
        .order("created_at", { ascending: false });
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ notices: data });
    }
    case "emergencyMessages": {
      const { data, error } = await adminClient
        .from("emergency_messages")
        .select("*")
        .eq("is_active", true)
        .or("expires_at.is.null,expires_at.gt.now()")
        .order("created_at", { ascending: false });
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ messages: data });
    }
    case "marketNews": {
      const { data, error } = await adminClient
        .from("market_news")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ news: data });
    }
    case "achievements": {
      const { data, error } = await adminClient
        .from("achievements")
        .select("*")
        .eq("is_active", true);
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ achievements: data });
    }
    case "challenges": {
      const now = new Date().toISOString();
      const { data, error } = await adminClient
        .from("weekly_challenges")
        .select("*")
        .eq("is_active", true)
        .gt("ends_at", now);
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ challenges: data });
    }
    default:
      return jsonError("Invalid public action", 400);
  }
}

async function handleGamification(
  _req: Request,
  action: string,
  body: Record<string, unknown>,
  userId: string
): Promise<Response> {
  switch (action) {
    case "getLevel": {
      const { data, error } = await adminClient
        .from("user_levels")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ level: data });
    }
    case "getStreak": {
      const { data, error } = await adminClient
        .from("user_streaks")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ streak: data });
    }
    case "updateStreak": {
      const updates = body.updates as Record<string, unknown>;
      const { data, error } = await adminClient
        .from("user_streaks")
        .update(updates)
        .eq("user_id", userId)
        .select()
        .single();
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ streak: data });
    }
    case "getTodaySpin": {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await adminClient
        .from("spin_history")
        .select("*")
        .eq("user_id", userId)
        .eq("spin_date", today)
        .maybeSingle();
      return jsonSuccess({ spin: data, hasSpun: !!data });
    }
    case "spin": {
      const { prizeType, prizeValue } = body as { prizeType: string; prizeValue: number };
      
      // Cap at 80 KES
      const cappedValue = Math.min(prizeValue, 80);
      
      const { data: spin, error } = await adminClient
        .from("spin_history")
        .insert({
          user_id: userId,
          prize_type: prizeType,
          prize_value: cappedValue,
        })
        .select()
        .single();
      
      if (error) return jsonError(error.message, 400);
      
      // Update wallet if won cash
      if (prizeType === "cash" && cappedValue > 0) {
        const { data: wallet } = await adminClient
          .from("wallets")
          .select("balance")
          .eq("user_id", userId)
          .single();
        
        if (wallet) {
          await adminClient
            .from("wallets")
            .update({ balance: Number(wallet.balance) + cappedValue })
            .eq("user_id", userId);
          
          await adminClient.from("transactions").insert({
            user_id: userId,
            type: "spin_reward",
            amount: cappedValue,
            description: `Spin wheel prize`,
            status: "completed",
          });
        }
      }
      
      return jsonSuccess({ spin, prizeValue: cappedValue });
    }
    case "getAchievements": {
      const { data, error } = await adminClient
        .from("user_achievements")
        .select("*, achievements(*)")
        .eq("user_id", userId);
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ achievements: data });
    }
    case "getChallenges": {
      const { data, error } = await adminClient
        .from("user_challenges")
        .select("*, weekly_challenges(*)")
        .eq("user_id", userId);
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ challenges: data });
    }
    default:
      return jsonError("Invalid gamification action", 400);
  }
}

async function handleReferrals(
  _req: Request,
  action: string,
  body: Record<string, unknown>,
  userId: string
): Promise<Response> {
  switch (action) {
    case "list": {
      // Get user's profile ID first
      const { data: profile } = await adminClient
        .from("profiles")
        .select("id")
        .eq("user_id", userId)
        .single();
      
      if (!profile) return jsonSuccess({ referrals: [] });
      
      const { data, error } = await adminClient
        .from("referrals")
        .select("*, referred:referred_id(full_name, email)")
        .eq("referrer_id", profile.id);
      
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ referrals: data });
    }
    case "process": {
      const { referralCode } = body as { referralCode: string };
      
      // Find referrer by code
      const { data: referrer } = await adminClient
        .from("profiles")
        .select("id, user_id")
        .eq("referral_code", referralCode)
        .single();
      
      if (!referrer) return jsonError("Invalid referral code", 400);
      if (referrer.user_id === userId) return jsonError("Cannot refer yourself", 400);
      
      // Get current user's profile
      const { data: currentProfile } = await adminClient
        .from("profiles")
        .select("id, referred_by")
        .eq("user_id", userId)
        .single();
      
      if (!currentProfile) return jsonError("Profile not found", 400);
      if (currentProfile.referred_by) return jsonError("Already referred", 400);
      
      // Update profile with referrer
      await adminClient
        .from("profiles")
        .update({ referred_by: referrer.id })
        .eq("user_id", userId);
      
      // Create referral record
      await adminClient.from("referrals").insert({
        referrer_id: referrer.id,
        referred_id: currentProfile.id,
        status: "completed",
        reward_amount: 100,
      });
      
      // Award 100 KES to referrer
      const { data: referrerWallet } = await adminClient
        .from("wallets")
        .select("balance")
        .eq("user_id", referrer.user_id)
        .single();
      
      if (referrerWallet) {
        await adminClient
          .from("wallets")
          .update({ balance: Number(referrerWallet.balance) + 100 })
          .eq("user_id", referrer.user_id);
        
        await adminClient.from("transactions").insert({
          user_id: referrer.user_id,
          type: "referral_bonus",
          amount: 100,
          description: `Referral bonus`,
          status: "completed",
        });
      }
      
      return jsonSuccess({ success: true });
    }
    default:
      return jsonError("Invalid referrals action", 400);
  }
}

// Admin handlers
async function handleAdmin(
  _req: Request,
  action: string,
  body: Record<string, unknown>,
  adminId: string
): Promise<Response> {
  // Verify admin
  if (!(await isAdmin(adminId))) {
    return jsonError("Admin access required", 403);
  }
  
  switch (action) {
    case "getStats": {
      const [depositsRes, withdrawalsRes, usersRes, investmentsRes] = await Promise.all([
        adminClient.from("pending_deposits").select("amount, status").eq("status", "approved"),
        adminClient.from("pending_withdrawals").select("amount, status").eq("status", "completed"),
        adminClient.from("profiles").select("id", { count: "exact" }),
        adminClient.from("investments").select("amount").eq("status", "active"),
      ]);
      
      const totalDeposits = depositsRes.data?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
      const totalWithdrawals = withdrawalsRes.data?.reduce((sum, w) => sum + Number(w.amount), 0) || 0;
      const totalUsers = usersRes.count || 0;
      const activeInvestments = investmentsRes.data?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;
      
      return jsonSuccess({
        stats: {
          totalDeposits,
          totalWithdrawals,
          totalUsers,
          activeInvestments,
          cashFlow: totalDeposits - totalWithdrawals,
        },
      });
    }
    case "getAllDeposits": {
      const { data, error } = await adminClient
        .from("pending_deposits")
        .select("*, profiles:user_id(full_name, email, phone)")
        .order("created_at", { ascending: false });
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ deposits: data });
    }
    case "getAllWithdrawals": {
      const { data, error } = await adminClient
        .from("pending_withdrawals")
        .select("*, profiles:user_id(full_name, email, phone)")
        .order("created_at", { ascending: false });
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ withdrawals: data });
    }
    case "getAllUsers": {
      const { data, error } = await adminClient
        .from("profiles")
        .select("*, wallets(balance, total_invested, total_returns), user_roles(role)")
        .order("created_at", { ascending: false });
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ users: data });
    }
    case "approveDeposit": {
      const { depositId, approve, adminNotes } = body as { 
        depositId: string; 
        approve: boolean;
        adminNotes?: string;
      };
      
      const { data: deposit, error: fetchError } = await adminClient
        .from("pending_deposits")
        .select("*")
        .eq("id", depositId)
        .single();
      
      if (fetchError) return jsonError("Deposit not found", 400);
      
      await adminClient
        .from("pending_deposits")
        .update({
          status: approve ? "approved" : "rejected",
          approved_by: adminId,
          approved_at: new Date().toISOString(),
          admin_notes: adminNotes,
        })
        .eq("id", depositId);
      
      if (approve) {
        const { data: wallet } = await adminClient
          .from("wallets")
          .select("*")
          .eq("user_id", deposit.user_id)
          .single();
        
        if (wallet) {
          await adminClient
            .from("wallets")
            .update({ balance: Number(wallet.balance) + Number(deposit.amount) })
            .eq("user_id", deposit.user_id);
        }
        
        await adminClient.from("transactions").insert({
          user_id: deposit.user_id,
          type: "deposit",
          amount: deposit.amount,
          description: `M-PESA Deposit - ${deposit.mpesa_code || "Manual"}`,
          status: "completed",
        });
      }
      
      await adminClient.from("admin_audit_log").insert({
        admin_id: adminId,
        action: approve ? "approve_deposit" : "reject_deposit",
        target_table: "pending_deposits",
        target_id: depositId,
        details: { amount: deposit.amount, user_id: deposit.user_id, notes: adminNotes },
      });
      
      return jsonSuccess({ success: true });
    }
    case "processWithdrawal": {
      const { withdrawalId, approve, adminNotes } = body as { 
        withdrawalId: string; 
        approve: boolean;
        adminNotes?: string;
      };
      
      const { data: withdrawal, error: fetchError } = await adminClient
        .from("pending_withdrawals")
        .select("*")
        .eq("id", withdrawalId)
        .single();
      
      if (fetchError) return jsonError("Withdrawal not found", 400);
      
      await adminClient
        .from("pending_withdrawals")
        .update({
          status: approve ? "completed" : "rejected",
          processed_by: adminId,
          processed_at: new Date().toISOString(),
          admin_notes: adminNotes,
        })
        .eq("id", withdrawalId);
      
      if (approve) {
        await adminClient.from("transactions").insert({
          user_id: withdrawal.user_id,
          type: "withdrawal",
          amount: -withdrawal.amount,
          description: `Withdrawal to ${withdrawal.phone_number}`,
          status: "completed",
        });
      } else {
        // Refund
        const { data: wallet } = await adminClient
          .from("wallets")
          .select("balance")
          .eq("user_id", withdrawal.user_id)
          .single();
        
        if (wallet) {
          await adminClient
            .from("wallets")
            .update({ balance: Number(wallet.balance) + Number(withdrawal.amount) })
            .eq("user_id", withdrawal.user_id);
        }
      }
      
      await adminClient.from("admin_audit_log").insert({
        admin_id: adminId,
        action: approve ? "approve_withdrawal" : "reject_withdrawal",
        target_table: "pending_withdrawals",
        target_id: withdrawalId,
        details: { amount: withdrawal.amount, user_id: withdrawal.user_id, notes: adminNotes },
      });
      
      return jsonSuccess({ success: true });
    }
    case "updateUserBalance": {
      const { userId, amount, reason } = body as { userId: string; amount: number; reason: string };
      
      const { data: wallet, error: walletError } = await adminClient
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .single();
      
      if (walletError) return jsonError("Wallet not found", 400);
      
      const newBalance = Number(wallet.balance) + amount;
      
      await adminClient
        .from("wallets")
        .update({ balance: newBalance })
        .eq("user_id", userId);
      
      await adminClient.from("transactions").insert({
        user_id: userId,
        type: amount > 0 ? "deposit" : "withdrawal",
        amount: amount,
        description: `Admin adjustment: ${reason}`,
        status: "completed",
      });
      
      await adminClient.from("admin_audit_log").insert({
        admin_id: adminId,
        action: "balance_adjustment",
        target_table: "wallets",
        target_id: wallet.id,
        details: { user_id: userId, amount, reason, new_balance: newBalance },
      });
      
      return jsonSuccess({ success: true });
    }
    case "getPaymentNumbers": {
      const { data, error } = await adminClient
        .from("payment_numbers")
        .select("*")
        .order("priority", { ascending: true });
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ numbers: data });
    }
    case "addPaymentNumber": {
      const { phone, name } = body as { phone: string; name: string };
      const { error } = await adminClient
        .from("payment_numbers")
        .insert({ phone_number: phone, account_name: name });
      if (error) return jsonError(error.message, 400);
      
      await adminClient.from("admin_audit_log").insert({
        admin_id: adminId,
        action: "add_payment_number",
        target_table: "payment_numbers",
        details: { phone, name },
      });
      
      return jsonSuccess({ success: true });
    }
    case "togglePaymentNumber": {
      const { id, isActive } = body as { id: string; isActive: boolean };
      const { error } = await adminClient
        .from("payment_numbers")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) return jsonError(error.message, 400);
      
      await adminClient.from("admin_audit_log").insert({
        admin_id: adminId,
        action: isActive ? "activate_payment_number" : "deactivate_payment_number",
        target_table: "payment_numbers",
        target_id: id,
      });
      
      return jsonSuccess({ success: true });
    }
    case "getEmergencyMessages": {
      const { data, error } = await adminClient
        .from("emergency_messages")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ messages: data });
    }
    case "createEmergencyMessage": {
      const { title, message, imageUrl, expiresAt } = body as { 
        title: string; 
        message: string; 
        imageUrl?: string;
        expiresAt?: string;
      };
      const { error } = await adminClient.from("emergency_messages").insert({
        title,
        message,
        image_url: imageUrl,
        expires_at: expiresAt,
        created_by: adminId,
      });
      if (error) return jsonError(error.message, 400);
      
      await adminClient.from("admin_audit_log").insert({
        admin_id: adminId,
        action: "create_emergency_message",
        target_table: "emergency_messages",
        details: { title },
      });
      
      return jsonSuccess({ success: true });
    }
    case "toggleEmergencyMessage": {
      const { id, isActive } = body as { id: string; isActive: boolean };
      const { error } = await adminClient
        .from("emergency_messages")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ success: true });
    }
    case "getMarketNews": {
      const { data, error } = await adminClient
        .from("market_news")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ news: data });
    }
    case "createMarketNews": {
      const { title, description, imageUrl } = body as { 
        title: string; 
        description: string; 
        imageUrl?: string;
      };
      const { error } = await adminClient.from("market_news").insert({
        title,
        description,
        image_url: imageUrl,
        created_by: adminId,
      });
      if (error) return jsonError(error.message, 400);
      
      await adminClient.from("admin_audit_log").insert({
        admin_id: adminId,
        action: "create_market_news",
        target_table: "market_news",
        details: { title },
      });
      
      return jsonSuccess({ success: true });
    }
    case "toggleMarketNews": {
      const { id, isActive } = body as { id: string; isActive: boolean };
      const { error } = await adminClient
        .from("market_news")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ success: true });
    }
    case "getNotices": {
      const { data, error } = await adminClient
        .from("notices")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ notices: data });
    }
    case "createNotice": {
      const { title, message, type, expiresAt } = body as { 
        title: string; 
        message: string; 
        type?: string;
        expiresAt?: string;
      };
      const { error } = await adminClient.from("notices").insert({
        title,
        message,
        type: type || "info",
        expires_at: expiresAt,
      });
      if (error) return jsonError(error.message, 400);
      
      await adminClient.from("admin_audit_log").insert({
        admin_id: adminId,
        action: "create_notice",
        target_table: "notices",
        details: { title, type },
      });
      
      return jsonSuccess({ success: true });
    }
    case "toggleNotice": {
      const { id, isActive } = body as { id: string; isActive: boolean };
      const { error } = await adminClient
        .from("notices")
        .update({ is_active: isActive })
        .eq("id", id);
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ success: true });
    }
    case "uploadImage": {
      // For image uploads, we return a presigned URL
      const { bucket, fileName, contentType } = body as { 
        bucket: string; 
        fileName: string;
        contentType: string;
      };
      
      const { data, error } = await adminClient.storage
        .from(bucket)
        .createSignedUploadUrl(fileName);
      
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ signedUrl: data.signedUrl, path: data.path });
    }
    case "getImageUrl": {
      const { bucket, path } = body as { bucket: string; path: string };
      const { data } = adminClient.storage.from(bucket).getPublicUrl(path);
      return jsonSuccess({ publicUrl: data.publicUrl });
    }
    default:
      return jsonError("Invalid admin action", 400);
  }
}

// Utility functions
function jsonSuccess(data: Record<string, unknown>): Response {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  
  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/").filter(Boolean);
    
    // Expected: /api/{resource}/{action}
    // e.g., /api/auth/signIn, /api/profile/get, /api/admin/getStats
    const resource = pathParts[1] || "";
    const action = pathParts[2] || "";
    
    const body = req.method === "POST" ? await req.json() : {};
    const authHeader = req.headers.get("Authorization");
    
    // Public routes (no auth required)
    if (resource === "auth") {
      return await handleAuth(req, action, body);
    }
    
    if (resource === "public") {
      return await handlePublic(req, action, body);
    }
    
    if (resource === "investments" && action === "recent") {
      return await handleInvestments(req, action, body, "");
    }
    
    // Protected routes (require auth)
    const { user, error: authError } = await verifyUser(authHeader);
    
    if (authError || !user) {
      return jsonError("Unauthorized", 401);
    }
    
    switch (resource) {
      case "profile":
        return await handleProfile(req, action, body, user.id);
      case "wallet":
        return await handleWallet(req, action, body, user.id);
      case "transactions":
        return await handleTransactions(req, action, body, user.id);
      case "deposits":
        return await handleDeposits(req, action, body, user.id);
      case "withdrawals":
        return await handleWithdrawals(req, action, body, user.id);
      case "products":
        return await handleProducts(req, action, body);
      case "investments":
        return await handleInvestments(req, action, body, user.id);
      case "gamification":
        return await handleGamification(req, action, body, user.id);
      case "referrals":
        return await handleReferrals(req, action, body, user.id);
      case "admin":
        return await handleAdmin(req, action, body, user.id);
      default:
        return jsonError("Not found", 404);
    }
  } catch (error) {
    console.error("API Error:", error);
    return jsonError(error instanceof Error ? error.message : "Internal server error", 500);
  }
});
