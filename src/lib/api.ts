// API client that routes all requests through Edge Functions
// This prevents Supabase URLs from appearing in browser DevTools

const API_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/api`;

type ApiResponse<T> = T & { error?: string };

class ApiClient {
  private accessToken: string | null = null;

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  private async request<T>(
    resource: string,
    action: string,
    body: Record<string, unknown> = {}
  ): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (this.accessToken) {
      headers["Authorization"] = `Bearer ${this.accessToken}`;
    }

    const response = await fetch(`${API_BASE}/${resource}/${action}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || "Request failed");
    }

    return data as T;
  }

  // Auth endpoints
  auth = {
    signUp: (email: string, password: string, fullName: string) =>
      this.request<{ user: unknown; session: unknown }>("auth", "signUp", { email, password, fullName }),
    signIn: (email: string, password: string) =>
      this.request<{ user: unknown; session: unknown }>("auth", "signIn", { email, password }),
    signOut: () => this.request("auth", "signOut", {}),
    resetPassword: (email: string, redirectTo: string) =>
      this.request("auth", "resetPassword", { email, redirectTo }),
    getSession: () => this.request<{ session: unknown }>("auth", "getSession", {}),
  };

  // Profile endpoints
  profile = {
    get: () => this.request<{ profile: Profile | null }>("profile", "get", {}),
    update: (updates: Partial<Profile>) =>
      this.request<{ profile: Profile }>("profile", "update", { updates }),
  };

  // Wallet endpoints
  wallet = {
    get: () => this.request<{ wallet: Wallet | null }>("wallet", "get", {}),
    update: (updates: { balance?: number; total_invested?: number; pending_returns?: number }) =>
      this.request<{ wallet: Wallet }>("wallet", "update", { updates }),
  };

  // Transactions endpoints
  transactions = {
    list: () => this.request<{ transactions: Transaction[] }>("transactions", "list", {}),
    create: (transaction: { type: string; amount: number; description?: string; reference_id?: string; status?: string }) =>
      this.request<{ transaction: Transaction }>("transactions", "create", { transaction }),
  };


  // Deposits endpoints
  deposits = {
    list: () => this.request<{ deposits: Deposit[] }>("deposits", "list", {}),
    create: (data: { amount: number; phoneNumber: string; mpesaCode?: string; paymentNumberUsed: string }) =>
      this.request<{ deposit: Deposit }>("deposits", "create", data),
  };

  // Withdrawals endpoints
  withdrawals = {
    list: () => this.request<{ withdrawals: Withdrawal[] }>("withdrawals", "list", {}),
    create: (data: { amount: number; phoneNumber: string }) =>
      this.request<{ withdrawal: Withdrawal }>("withdrawals", "create", data),
  };

  // Products endpoints
  products = {
    list: () => this.request<{ products: Product[] }>("products", "list", {}),
    get: (id: string) => this.request<{ product: Product }>("products", "get", { id }),
  };

  // Investments endpoints
  investments = {
    list: () => this.request<{ investments: Investment[] }>("investments", "list", {}),
    create: (data: { productId: string; amount: number; expectedReturn: number; maturesAt: string }) =>
      this.request<{ investment: Investment }>("investments", "create", data),
    recent: () => this.request<{ investments: RecentInvestment[] }>("investments", "recent", {}),
  };

  // Public endpoints
  public = {
    paymentNumbers: () => this.request<{ numbers: PaymentNumber[] }>("public", "paymentNumbers", {}),
    notices: () => this.request<{ notices: Notice[] }>("public", "notices", {}),
    emergencyMessages: () => this.request<{ messages: EmergencyMessage[] }>("public", "emergencyMessages", {}),
    marketNews: () => this.request<{ news: MarketNews[] }>("public", "marketNews", {}),
    achievements: () => this.request<{ achievements: Achievement[] }>("public", "achievements", {}),
    challenges: () => this.request<{ challenges: WeeklyChallenge[] }>("public", "challenges", {}),
  };

  // Gamification endpoints
  gamification = {
    getLevel: () => this.request<{ level: UserLevel | null }>("gamification", "getLevel", {}),
    getStreak: () => this.request<{ streak: UserStreak | null }>("gamification", "getStreak", {}),
    updateStreak: (updates: Partial<UserStreak>) =>
      this.request<{ streak: UserStreak }>("gamification", "updateStreak", { updates }),
    getTodaySpin: () => this.request<{ spin: SpinHistory | null; hasSpun: boolean }>("gamification", "getTodaySpin", {}),
    spin: (prizeType: string, prizeValue: number) =>
      this.request<{ spin: SpinHistory; prizeValue: number }>("gamification", "spin", { prizeType, prizeValue }),
    getAchievements: () => this.request<{ achievements: UserAchievement[] }>("gamification", "getAchievements", {}),
    getChallenges: () => this.request<{ challenges: UserChallenge[] }>("gamification", "getChallenges", {}),
    claimStreakReward: (streakDay: number, rewardAmount: number) =>
      this.request<{ reward: { amount: number } }>("gamification", "claimStreakReward", { streakDay, rewardAmount }),
    joinChallenge: (challengeId: string) =>
      this.request<{ challenge: UserChallenge }>("gamification", "joinChallenge", { challengeId }),
    claimChallengeReward: (challengeId: string) =>
      this.request<{ success: boolean }>("gamification", "claimChallengeReward", { challengeId }),
    checkAchievements: () =>
      this.request<{ newAchievements: Achievement[] }>("gamification", "checkAchievements", {}),
  };

  // Referrals endpoints
  referrals = {
    list: () => this.request<{ referrals: Referral[] }>("referrals", "list", {}),
    process: (referralCode: string) =>
      this.request<{ success: boolean }>("referrals", "process", { referralCode }),
  };

  // Admin endpoints
  admin = {
    getStats: () => this.request<{ stats: PlatformStats }>("admin", "getStats", {}),
    getAllDeposits: () => this.request<{ deposits: AdminDeposit[] }>("admin", "getAllDeposits", {}),
    getAllWithdrawals: () => this.request<{ withdrawals: AdminWithdrawal[] }>("admin", "getAllWithdrawals", {}),
    getAllUsers: () => this.request<{ users: AdminUser[] }>("admin", "getAllUsers", {}),
    approveDeposit: (depositId: string, approve: boolean, adminNotes?: string) =>
      this.request<{ success: boolean }>("admin", "approveDeposit", { depositId, approve, adminNotes }),
    processWithdrawal: (withdrawalId: string, approve: boolean, adminNotes?: string) =>
      this.request<{ success: boolean }>("admin", "processWithdrawal", { withdrawalId, approve, adminNotes }),
    updateUserBalance: (userId: string, amount: number, reason: string) =>
      this.request<{ success: boolean }>("admin", "updateUserBalance", { userId, amount, reason }),
    getPaymentNumbers: () => this.request<{ numbers: PaymentNumber[] }>("admin", "getPaymentNumbers", {}),
    addPaymentNumber: (phone: string, name: string) =>
      this.request<{ success: boolean }>("admin", "addPaymentNumber", { phone, name }),
    togglePaymentNumber: (id: string, isActive: boolean) =>
      this.request<{ success: boolean }>("admin", "togglePaymentNumber", { id, isActive }),
    deletePaymentNumber: (id: string) =>
      this.request<{ success: boolean }>("admin", "deletePaymentNumber", { id }),
    getEmergencyMessages: () => this.request<{ messages: EmergencyMessage[] }>("admin", "getEmergencyMessages", {}),
    createEmergencyMessage: (title: string, message: string, imageUrl?: string, expiresAt?: string) =>
      this.request<{ success: boolean }>("admin", "createEmergencyMessage", { title, message, imageUrl, expiresAt }),
    toggleEmergencyMessage: (id: string, isActive: boolean) =>
      this.request<{ success: boolean }>("admin", "toggleEmergencyMessage", { id, isActive }),
    deleteEmergencyMessage: (id: string) =>
      this.request<{ success: boolean }>("admin", "deleteEmergencyMessage", { id }),
    getMarketNews: () => this.request<{ news: MarketNews[] }>("admin", "getMarketNews", {}),
    createMarketNews: (title: string, description: string, imageUrl?: string) =>
      this.request<{ success: boolean }>("admin", "createMarketNews", { title, description, imageUrl }),
    toggleMarketNews: (id: string, isActive: boolean) =>
      this.request<{ success: boolean }>("admin", "toggleMarketNews", { id, isActive }),
    deleteMarketNews: (id: string) =>
      this.request<{ success: boolean }>("admin", "deleteMarketNews", { id }),
    getNotices: () => this.request<{ notices: Notice[] }>("admin", "getNotices", {}),
    createNotice: (title: string, message: string, type?: string, expiresAt?: string) =>
      this.request<{ success: boolean }>("admin", "createNotice", { title, message, type, expiresAt }),
    toggleNotice: (id: string, isActive: boolean) =>
      this.request<{ success: boolean }>("admin", "toggleNotice", { id, isActive }),
    deleteNotice: (id: string) =>
      this.request<{ success: boolean }>("admin", "deleteNotice", { id }),
    deleteUser: (userId: string) =>
      this.request<{ success: boolean }>("admin", "deleteUser", { userId }),
    uploadImage: (bucket: string, fileName: string, contentType: string) =>
      this.request<{ signedUrl: string; path: string }>("admin", "uploadImage", { bucket, fileName, contentType }),
    getImageUrl: (bucket: string, path: string) =>
      this.request<{ publicUrl: string }>("admin", "getImageUrl", { bucket, path }),
    getPlatformSettings: () => 
      this.request<{ settings: PlatformSetting[] }>("admin", "getPlatformSettings", {}),
    updatePlatformSetting: (key: string, value: Record<string, unknown>) =>
      this.request<{ success: boolean }>("admin", "updatePlatformSetting", { key, value }),
    resetAllData: () =>
      this.request<{ success: boolean }>("admin", "resetAllData", {}),
    getSuspiciousActivities: () =>
      this.request<{ activities: SuspiciousActivity[] }>("admin", "getSuspiciousActivities", {}),
    resolveSuspiciousActivity: (id: string) =>
      this.request<{ success: boolean }>("admin", "resolveSuspiciousActivity", { id }),
  };
}

export interface PlatformSetting {
  id: string;
  key: string;
  value: { frozen?: boolean; whatsapp_number?: string };
  updated_at: string;
  updated_by: string | null;
}

export interface SuspiciousActivity {
  id: string;
  user_id: string | null;
  action: string;
  ip_address: string | null;
  user_agent: string | null;
  browser: string | null;
  device: string | null;
  location: string | null;
  severity: string;
  details: Record<string, unknown>;
  resolved: boolean;
  resolved_by: string | null;
  resolved_at: string | null;
  created_at: string;
}

// Types
export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  referral_code: string | null;
  referred_by: string | null;
  hide_balance: boolean;
  created_at: string;
  updated_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  total_invested: number;
  total_returns: number;
  pending_returns: number;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  description: string | null;
  status: string;
  reference_id: string | null;
  created_at: string;
}

export interface Deposit {
  id: string;
  user_id: string;
  amount: number;
  phone_number: string;
  mpesa_code: string | null;
  payment_number_used: string;
  status: string;
  admin_notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Withdrawal {
  id: string;
  user_id: string;
  amount: number;
  phone_number: string;
  status: string;
  admin_notes: string | null;
  processed_by: string | null;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  expected_return: number;
  duration_days: number;
  category: string;
  image_url: string | null;
  is_active: boolean;
  is_popular: boolean;
  total_units: number | null;
  units_sold: number | null;
  min_level: number | null;
  created_at: string;
  updated_at: string;
}

export interface Investment {
  id: string;
  user_id: string;
  product_id: string;
  amount: number;
  expected_return: number;
  status: string;
  purchased_at: string;
  matures_at: string;
  created_at: string;
  products?: Product;
}

export interface RecentInvestment {
  amount: number;
  expected_return: number;
  created_at: string;
  products: { name: string } | null;
}

export interface PaymentNumber {
  id: string;
  phone_number: string;
  account_name: string;
  is_active: boolean;
  priority: number;
  created_at: string;
  updated_at: string;
}

export interface Notice {
  id: string;
  title: string;
  message: string;
  type: string;
  is_active: boolean | null;
  expires_at: string | null;
  created_at: string;
}

export interface EmergencyMessage {
  id: string;
  title: string;
  message: string;
  image_url: string | null;
  is_active: boolean;
  expires_at: string | null;
  created_by: string;
  created_at: string;
}

export interface MarketNews {
  id: string;
  title: string;
  description: string;
  image_url: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Achievement {
  id: string;
  code: string;
  title: string;
  description: string;
  icon: string;
  tier: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  reward_amount: number;
  xp_reward: number;
  is_active: boolean;
  created_at: string;
}

export interface WeeklyChallenge {
  id: string;
  title: string;
  description: string;
  challenge_type: string;
  target_value: number;
  reward_amount: number;
  xp_reward: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  created_at: string;
}

export interface UserLevel {
  id: string;
  user_id: string;
  current_level: number;
  current_xp: number;
  total_xp: number;
  level_title: string;
  created_at: string;
  updated_at: string;
}

export interface UserStreak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  total_login_days: number;
  last_login_date: string | null;
  streak_freeze_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface SpinHistory {
  id: string;
  user_id: string;
  prize_type: string;
  prize_value: number;
  spin_date: string;
  created_at: string;
}

export interface UserAchievement {
  id: string;
  user_id: string;
  achievement_id: string;
  achieved_at: string;
  reward_claimed: boolean;
  achievements?: Achievement;
}

export interface UserChallenge {
  id: string;
  user_id: string;
  challenge_id: string;
  current_progress: number;
  completed: boolean;
  completed_at: string | null;
  reward_claimed: boolean;
  joined_at: string;
  weekly_challenges?: WeeklyChallenge;
}

export interface Referral {
  id: string;
  referrer_id: string;
  referred_id: string;
  status: string;
  reward_amount: number | null;
  created_at: string;
  referred?: { full_name: string | null; email: string | null };
  referred_profile?: { full_name: string | null; email: string | null; created_at?: string };
}

export interface PlatformStats {
  totalDeposits: number;
  totalWithdrawals: number;
  totalUsers: number;
  activeInvestments: number;
  cashFlow: number;
}

export interface AdminDeposit extends Deposit {
  profiles?: { full_name: string | null; email: string | null; phone: string | null };
}

export interface AdminWithdrawal extends Withdrawal {
  profiles?: { full_name: string | null; email: string | null; phone: string | null };
}

export interface AdminUser {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  referral_code: string | null;
  referred_by: string | null;
  hide_balance: boolean;
  created_at: string;
  updated_at: string;
  wallets?: { balance: number; total_invested: number; total_returns: number }[];
  user_roles?: { role: string }[];
  user_levels?: { current_level: number; level_title: string; total_xp: number }[];
  badges_count?: number;
  active_investments_count?: number;
  pending_deposits_count?: number;
  pending_withdrawals_count?: number;
}

export const api = new ApiClient();
