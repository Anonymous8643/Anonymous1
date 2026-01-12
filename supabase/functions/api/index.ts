import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-forwarded-for, x-real-ip",
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

// Helper to extract client info from request
function getClientInfo(req: Request): { ipAddress: string; userAgent: string; browser: string; device: string } {
  const userAgent = req.headers.get("user-agent") || "Unknown";
  const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
                    req.headers.get("x-real-ip") || 
                    "Unknown";
  
  // Parse browser from user agent
  let browser = "Unknown";
  if (userAgent.includes("Chrome")) browser = "Chrome";
  else if (userAgent.includes("Firefox")) browser = "Firefox";
  else if (userAgent.includes("Safari")) browser = "Safari";
  else if (userAgent.includes("Edge")) browser = "Edge";
  else if (userAgent.includes("Opera")) browser = "Opera";
  
  // Parse device from user agent
  let device = "Desktop";
  if (userAgent.includes("Mobile")) device = "Mobile";
  else if (userAgent.includes("Tablet") || userAgent.includes("iPad")) device = "Tablet";
  
  return { ipAddress, userAgent, browser, device };
}

// Log suspicious activity
async function logSuspiciousActivity(
  userId: string | null,
  action: string,
  severity: "low" | "medium" | "high" | "critical",
  details: Record<string, unknown>,
  clientInfo: { ipAddress: string; userAgent: string; browser: string; device: string }
) {
  try {
    await adminClient.from("suspicious_activities").insert({
      user_id: userId,
      action,
      severity,
      details,
      ip_address: clientInfo.ipAddress,
      user_agent: clientInfo.userAgent,
      browser: clientInfo.browser,
      device: clientInfo.device,
    });
    console.log(`Suspicious activity logged: ${action} (${severity})`);
  } catch (error) {
    console.error("Failed to log suspicious activity:", error);
  }
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
  body: Record<string, unknown>,
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
    case "update": {
      const updates = body.updates as Record<string, unknown>;
      const { data, error } = await adminClient
        .from("wallets")
        .update(updates)
        .eq("user_id", userId)
        .select()
        .single();
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
  body: Record<string, unknown>,
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
    case "create": {
      const transaction = body.transaction as {
        type: string;
        amount: number;
        description?: string;
        reference_id?: string;
        status?: string;
      };
      const { data, error } = await adminClient
        .from("transactions")
        .insert({
          user_id: userId,
          type: transaction.type,
          amount: transaction.amount,
          description: transaction.description || null,
          reference_id: transaction.reference_id || null,
          status: transaction.status || "completed",
        })
        .select()
        .single();
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ transaction: data });
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
    case "claimStreakReward": {
      const { streakDay, rewardAmount } = body as { streakDay: number; rewardAmount: number };
      
      // Check if reward already claimed for this streak day
      const today = new Date().toISOString().split("T")[0];
      const { data: existingReward } = await adminClient
        .from("streak_rewards")
        .select("id")
        .eq("user_id", userId)
        .eq("streak_day", streakDay)
        .gte("claimed_at", today)
        .maybeSingle();
      
      if (existingReward) {
        return jsonSuccess({ reward: { amount: 0 }, alreadyClaimed: true });
      }
      
      // Add reward to wallet
      const { data: wallet } = await adminClient
        .from("wallets")
        .select("balance")
        .eq("user_id", userId)
        .single();
      
      if (wallet) {
        await adminClient
          .from("wallets")
          .update({ balance: Number(wallet.balance) + rewardAmount })
          .eq("user_id", userId);
        
        // Create transaction
        await adminClient.from("transactions").insert({
          user_id: userId,
          type: "streak_reward",
          amount: rewardAmount,
          description: `Day ${streakDay} streak reward`,
          status: "completed",
        });
        
        // Record the streak reward claim
        await adminClient.from("streak_rewards").insert({
          user_id: userId,
          streak_day: streakDay,
          reward_amount: rewardAmount,
        });
      }
      
      return jsonSuccess({ reward: { amount: rewardAmount } });
    }
    case "joinChallenge": {
      const { challengeId } = body as { challengeId: string };
      
      // Check if already joined
      const { data: existing } = await adminClient
        .from("user_challenges")
        .select("id")
        .eq("user_id", userId)
        .eq("challenge_id", challengeId)
        .maybeSingle();
      
      if (existing) {
        return jsonError("Already joined this challenge", 400);
      }
      
      const { data: challenge, error } = await adminClient
        .from("user_challenges")
        .insert({
          user_id: userId,
          challenge_id: challengeId,
          current_progress: 0,
          completed: false,
        })
        .select("*, weekly_challenges(*)")
        .single();
      
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ challenge });
    }
    case "claimChallengeReward": {
      const { challengeId } = body as { challengeId: string };
      
      const { data: userChallenge } = await adminClient
        .from("user_challenges")
        .select("*, weekly_challenges(*)")
        .eq("user_id", userId)
        .eq("challenge_id", challengeId)
        .single();
      
      if (!userChallenge) return jsonError("Challenge not found", 400);
      if (!userChallenge.completed) return jsonError("Challenge not completed", 400);
      if (userChallenge.reward_claimed) return jsonError("Reward already claimed", 400);
      
      const rewardAmount = userChallenge.weekly_challenges?.reward_amount || 0;
      
      // Add reward to wallet
      const { data: wallet } = await adminClient
        .from("wallets")
        .select("balance")
        .eq("user_id", userId)
        .single();
      
      if (wallet && rewardAmount > 0) {
        await adminClient
          .from("wallets")
          .update({ balance: Number(wallet.balance) + rewardAmount })
          .eq("user_id", userId);
        
        await adminClient.from("transactions").insert({
          user_id: userId,
          type: "challenge_reward",
          amount: rewardAmount,
          description: `Challenge completed: ${userChallenge.weekly_challenges?.title}`,
          status: "completed",
        });
      }
      
      await adminClient
        .from("user_challenges")
        .update({ reward_claimed: true })
        .eq("id", userChallenge.id);
      
      return jsonSuccess({ success: true });
    }
    case "checkAchievements": {
      // Get all achievements
      const { data: achievements } = await adminClient
        .from("achievements")
        .select("*")
        .eq("is_active", true);
      
      // Get user's current achievements
      const { data: userAchievements } = await adminClient
        .from("user_achievements")
        .select("achievement_id")
        .eq("user_id", userId);
      
      const earnedIds = new Set(userAchievements?.map(ua => ua.achievement_id) || []);
      
      // Get user stats for checking requirements
      const [investmentsRes, depositsRes, referralsRes, streakRes] = await Promise.all([
        adminClient.from("investments").select("amount").eq("user_id", userId).eq("status", "active"),
        adminClient.from("pending_deposits").select("amount").eq("user_id", userId).eq("status", "approved"),
        adminClient.from("referrals").select("id").eq("referrer_id", userId),
        adminClient.from("user_streaks").select("current_streak, longest_streak").eq("user_id", userId).single(),
      ]);
      
      const totalInvested = investmentsRes.data?.reduce((sum, i) => sum + Number(i.amount), 0) || 0;
      const totalDeposited = depositsRes.data?.reduce((sum, d) => sum + Number(d.amount), 0) || 0;
      const referralCount = referralsRes.data?.length || 0;
      const longestStreak = streakRes.data?.longest_streak || 0;
      
      const newAchievements: any[] = [];
      
      for (const achievement of achievements || []) {
        if (earnedIds.has(achievement.id)) continue;
        
        let earned = false;
        switch (achievement.requirement_type) {
          case "total_invested":
            earned = totalInvested >= achievement.requirement_value;
            break;
          case "total_deposited":
            earned = totalDeposited >= achievement.requirement_value;
            break;
          case "referral_count":
            earned = referralCount >= achievement.requirement_value;
            break;
          case "streak_days":
            earned = longestStreak >= achievement.requirement_value;
            break;
        }
        
        if (earned) {
          await adminClient.from("user_achievements").insert({
            user_id: userId,
            achievement_id: achievement.id,
          });
          
          // Add XP and reward
          if (achievement.reward_amount > 0) {
            const { data: wallet } = await adminClient
              .from("wallets")
              .select("balance")
              .eq("user_id", userId)
              .single();
            
            if (wallet) {
              await adminClient
                .from("wallets")
                .update({ balance: Number(wallet.balance) + achievement.reward_amount })
                .eq("user_id", userId);
              
              await adminClient.from("transactions").insert({
                user_id: userId,
                type: "achievement_reward",
                amount: achievement.reward_amount,
                description: `Achievement unlocked: ${achievement.title}`,
                status: "completed",
              });
            }
          }
          
          newAchievements.push(achievement);
        }
      }
      
      return jsonSuccess({ newAchievements });
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
      
      // Create referral record with pending status - reward given on first deposit
      await adminClient.from("referrals").insert({
        referrer_id: referrer.id,
        referred_id: currentProfile.id,
        status: "pending", // Will be changed to completed/rewarded on first deposit
        reward_amount: 100,
      });
      
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
      // Fetch deposits
      const { data: deposits, error } = await adminClient
        .from("pending_deposits")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return jsonError(error.message, 400);
      
      // Get user profiles for these deposits
      const userIds = [...new Set(deposits?.map((d: any) => d.user_id) || [])];
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("user_id, full_name, email, phone")
        .in("user_id", userIds);
      
      // Create a lookup map
      const profileMap: Record<string, any> = {};
      profiles?.forEach((p: any) => { profileMap[p.user_id] = p; });
      
      // Enrich deposits with profile info
      const enrichedDeposits = deposits?.map((d: any) => ({
        ...d,
        profiles: profileMap[d.user_id] || null,
      }));
      
      return jsonSuccess({ deposits: enrichedDeposits });
    }
    case "getAllWithdrawals": {
      // Fetch withdrawals
      const { data: withdrawals, error } = await adminClient
        .from("pending_withdrawals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return jsonError(error.message, 400);
      
      // Get user profiles for these withdrawals
      const userIds = [...new Set(withdrawals?.map((w: any) => w.user_id) || [])];
      const { data: profiles } = await adminClient
        .from("profiles")
        .select("user_id, full_name, email, phone")
        .in("user_id", userIds);
      
      // Create a lookup map
      const profileMap: Record<string, any> = {};
      profiles?.forEach((p: any) => { profileMap[p.user_id] = p; });
      
      // Enrich withdrawals with profile info
      const enrichedWithdrawals = withdrawals?.map((w: any) => ({
        ...w,
        profiles: profileMap[w.user_id] || null,
      }));
      
      return jsonSuccess({ withdrawals: enrichedWithdrawals });
    }
    case "getAllUsers": {
      // Fetch profiles
      const { data: profiles, error } = await adminClient
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) return jsonError(error.message, 400);
      
      const userIds = profiles?.map((p: any) => p.user_id) || [];
      
      // Fetch related data in parallel
      const [walletsRes, rolesRes, levelsRes, achievementsRes, investmentsRes, depositsRes, withdrawalsRes] = await Promise.all([
        adminClient.from("wallets").select("user_id, balance, total_invested, total_returns").in("user_id", userIds),
        adminClient.from("user_roles").select("user_id, role").in("user_id", userIds),
        adminClient.from("user_levels").select("user_id, current_level, level_title, total_xp").in("user_id", userIds),
        adminClient.from("user_achievements").select("user_id").in("user_id", userIds),
        adminClient.from("investments").select("user_id, amount").eq("status", "active").in("user_id", userIds),
        adminClient.from("pending_deposits").select("user_id").eq("status", "pending").in("user_id", userIds),
        adminClient.from("pending_withdrawals").select("user_id").eq("status", "pending").in("user_id", userIds),
      ]);
      
      // Create lookup maps
      const walletMap: Record<string, any> = {};
      walletsRes.data?.forEach((w: any) => { walletMap[w.user_id] = w; });
      
      const roleMap: Record<string, string> = {};
      rolesRes.data?.forEach((r: any) => { roleMap[r.user_id] = r.role; });
      
      const levelMap: Record<string, any> = {};
      levelsRes.data?.forEach((l: any) => { levelMap[l.user_id] = l; });
      
      // Count achievements per user
      const achievementCounts: Record<string, number> = {};
      achievementsRes.data?.forEach((a: any) => {
        achievementCounts[a.user_id] = (achievementCounts[a.user_id] || 0) + 1;
      });
      
      // Count active investments per user
      const activeInvestmentCounts: Record<string, number> = {};
      investmentsRes.data?.forEach((i: any) => {
        activeInvestmentCounts[i.user_id] = (activeInvestmentCounts[i.user_id] || 0) + 1;
      });
      
      // Count pending deposits per user
      const pendingDepositCounts: Record<string, number> = {};
      depositsRes.data?.forEach((d: any) => {
        pendingDepositCounts[d.user_id] = (pendingDepositCounts[d.user_id] || 0) + 1;
      });
      
      // Count pending withdrawals per user
      const pendingWithdrawalCounts: Record<string, number> = {};
      withdrawalsRes.data?.forEach((w: any) => {
        pendingWithdrawalCounts[w.user_id] = (pendingWithdrawalCounts[w.user_id] || 0) + 1;
      });
      
      // Enrich user data
      const enrichedUsers = profiles?.map((user: any) => ({
        ...user,
        wallets: walletMap[user.user_id] ? [walletMap[user.user_id]] : [],
        user_roles: roleMap[user.user_id] ? [{ role: roleMap[user.user_id] }] : [],
        user_levels: levelMap[user.user_id] ? [levelMap[user.user_id]] : [],
        badges_count: achievementCounts[user.user_id] || 0,
        active_investments_count: activeInvestmentCounts[user.user_id] || 0,
        pending_deposits_count: pendingDepositCounts[user.user_id] || 0,
        pending_withdrawals_count: pendingWithdrawalCounts[user.user_id] || 0,
      }));
      
      return jsonSuccess({ users: enrichedUsers });
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
        
        // Check if this is user's first deposit and they have a pending referral
        // If so, reward the referrer
        const { data: profile } = await adminClient
          .from("profiles")
          .select("id, referred_by")
          .eq("user_id", deposit.user_id)
          .single();
        
        if (profile?.referred_by) {
          // Check for pending referral
          const { data: pendingReferral } = await adminClient
            .from("referrals")
            .select("*, referrer:referrer_id(user_id)")
            .eq("referred_id", profile.id)
            .eq("status", "pending")
            .single();
          
          if (pendingReferral && pendingReferral.referrer) {
            const referrerUserId = (pendingReferral.referrer as any).user_id;
            
            // Get referrer wallet and add bonus
            const { data: referrerWallet } = await adminClient
              .from("wallets")
              .select("balance")
              .eq("user_id", referrerUserId)
              .single();
            
            if (referrerWallet) {
              const bonusAmount = pendingReferral.reward_amount || 100;
              
              await adminClient
                .from("wallets")
                .update({ balance: Number(referrerWallet.balance) + bonusAmount })
                .eq("user_id", referrerUserId);
              
              await adminClient.from("transactions").insert({
                user_id: referrerUserId,
                type: "referral_bonus",
                amount: bonusAmount,
                description: `Referral bonus - New user deposited`,
                status: "completed",
              });
              
              // Update referral status to rewarded
              await adminClient
                .from("referrals")
                .update({ status: "rewarded" })
                .eq("id", pendingReferral.id);
            }
          }
        }
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
    case "deleteUser": {
      const { userId } = body as { userId: string };
      
      // Delete user from auth (this cascades to profiles, wallets, etc. due to foreign keys)
      const { error } = await adminClient.auth.admin.deleteUser(userId);
      
      if (error) return jsonError(error.message, 400);
      
      await adminClient.from("admin_audit_log").insert({
        admin_id: adminId,
        action: "delete_user",
        target_table: "auth.users",
        target_id: userId,
        details: { reason: "Terms violation" },
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
    case "deletePaymentNumber": {
      const { id } = body as { id: string };
      const { error } = await adminClient
        .from("payment_numbers")
        .delete()
        .eq("id", id);
      if (error) return jsonError(error.message, 400);
      
      await adminClient.from("admin_audit_log").insert({
        admin_id: adminId,
        action: "delete_payment_number",
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
    case "deleteEmergencyMessage": {
      const { id } = body as { id: string };
      const { error } = await adminClient
        .from("emergency_messages")
        .delete()
        .eq("id", id);
      if (error) return jsonError(error.message, 400);
      
      await adminClient.from("admin_audit_log").insert({
        admin_id: adminId,
        action: "delete_emergency_message",
        target_table: "emergency_messages",
        target_id: id,
      });
      
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
    case "deleteMarketNews": {
      const { id } = body as { id: string };
      const { error } = await adminClient
        .from("market_news")
        .delete()
        .eq("id", id);
      if (error) return jsonError(error.message, 400);
      
      await adminClient.from("admin_audit_log").insert({
        admin_id: adminId,
        action: "delete_market_news",
        target_table: "market_news",
        target_id: id,
      });
      
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
    case "deleteNotice": {
      const { id } = body as { id: string };
      const { error } = await adminClient
        .from("notices")
        .delete()
        .eq("id", id);
      if (error) return jsonError(error.message, 400);
      
      await adminClient.from("admin_audit_log").insert({
        admin_id: adminId,
        action: "delete_notice",
        target_table: "notices",
        target_id: id,
      });
      
      return jsonSuccess({ success: true });
    }
    case "getPlatformSettings": {
      const { data, error } = await adminClient
        .from("platform_settings")
        .select("*");
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ settings: data });
    }
    case "updatePlatformSetting": {
      const { key, value } = body as { key: string; value: Record<string, unknown> };
      
      // Use upsert to create if not exists
      const { error } = await adminClient
        .from("platform_settings")
        .upsert(
          { key, value, updated_by: adminId, updated_at: new Date().toISOString() },
          { onConflict: 'key' }
        );
      
      if (error) return jsonError(error.message, 400);
      
      await adminClient.from("admin_audit_log").insert({
        admin_id: adminId,
        action: "update_platform_setting",
        target_table: "platform_settings",
        details: { key, value },
      });
      
      return jsonSuccess({ success: true });
    }
    case "uploadImage": {
      const { bucket, fileName, contentType } = body as { 
        bucket: string; 
        fileName: string; 
        contentType: string;
      };
      
      const path = `${Date.now()}-${fileName}`;
      const { data, error } = await adminClient.storage
        .from(bucket)
        .createSignedUploadUrl(path);
      
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ signedUrl: data.signedUrl, path });
    }
    case "getImageUrl": {
      const { bucket, path } = body as { bucket: string; path: string };
      const { data } = adminClient.storage.from(bucket).getPublicUrl(path);
      return jsonSuccess({ publicUrl: data.publicUrl });
    }
    case "resetAllData": {
      // Reset deposits, withdrawals, transactions, investments, and stats
      const tables = ["pending_deposits", "pending_withdrawals", "transactions", "investments"];
      
      for (const table of tables) {
        const { error } = await adminClient.from(table).delete().neq("id", "00000000-0000-0000-0000-000000000000");
        if (error) console.error(`Failed to clear ${table}:`, error);
      }
      
      // Reset all wallet balances
      const { error: walletError } = await adminClient
        .from("wallets")
        .update({ balance: 0, total_invested: 0, total_returns: 0, pending_returns: 0 })
        .neq("id", "00000000-0000-0000-0000-000000000000");
      
      if (walletError) console.error("Failed to reset wallets:", walletError);
      
      await adminClient.from("admin_audit_log").insert({
        admin_id: adminId,
        action: "reset_all_data",
        details: { tables_cleared: tables, wallets_reset: true },
      });
      
      return jsonSuccess({ success: true });
    }
    case "getSuspiciousActivities": {
      const { data, error } = await adminClient
        .from("suspicious_activities")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ activities: data });
    }
    case "resolveSuspiciousActivity": {
      const { id } = body as { id: string };
      const { error } = await adminClient
        .from("suspicious_activities")
        .update({ resolved: true, resolved_by: adminId, resolved_at: new Date().toISOString() })
        .eq("id", id);
      if (error) return jsonError(error.message, 400);
      return jsonSuccess({ success: true });
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
  
  const clientInfo = getClientInfo(req);
  
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
      // Log failed auth attempts
      const result = await handleAuth(req, action, body);
      if (result.status === 400 && action === "signIn") {
        await logSuspiciousActivity(null, "failed_login_attempt", "medium", { email: body.email }, clientInfo);
      }
      return result;
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
      // Log unauthorized access attempts
      await logSuspiciousActivity(null, "unauthorized_access_attempt", "high", { resource, action }, clientInfo);
      return jsonError("Unauthorized", 401);
    }
    
    // Log high-value operations
    if (resource === "withdrawals" && action === "create") {
      const amount = body.amount as number;
      if (amount >= 10000) {
        await logSuspiciousActivity(user.id, "large_withdrawal_request", "medium", { amount }, clientInfo);
      }
    }
    
    // Log admin access
    if (resource === "admin") {
      await logSuspiciousActivity(user.id, `admin_action_${action}`, "low", { action }, clientInfo);
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
    // Log server errors
    await logSuspiciousActivity(null, "server_error", "high", { error: error instanceof Error ? error.message : "Unknown" }, clientInfo);
    return jsonError(error instanceof Error ? error.message : "Internal server error", 500);
  }
});
