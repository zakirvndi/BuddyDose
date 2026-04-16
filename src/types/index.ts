// ─── Category ─────────────────────────────────────────────────────────────────

export type Category = {
  id: string;
  name: string;
  created_at: string;
};

// ─── Medicine ────────────────────────────────────────────────────────────────

export type Medicine = {
  id: string;
  owner_user_id: string;
  owner_family_id?: string | null;
  target_user_id?: string;
  source_medicine_id?: string | null;
  name: string;
  dosage: string;
  notes?: string;
  category_id?: string;
  stock_qty?: number;
  expiration_date?: string; // ISO date string YYYY-MM-DD
  is_private?: boolean;
  created_at: string;
  schedules?: Schedule[];
  category?: Category;
};

export type Frequency = 'daily' | 'twice_daily' | 'three_times_daily';

export type Schedule = {
  id: string;
  medicine_id: string;
  scheduled_time: string; // HH:mm:ss format from time column
  frequency?: Frequency | string;
  is_active: boolean;
  /** ISO date: schedule starts on this day (default: today) */
  start_date: string;
  /** ISO date: schedule ends on this day (null = open-ended) */
  end_date?: string | null;
  created_at: string;
};

export type IntakeStatus = 'taken' | 'missed' | 'skipped';

export type IntakeLog = {
  id: string;
  schedule_id: string;
  user_id: string;
  scheduled_date: string;
  status: IntakeStatus;
  taken_at?: string;
  notes?: string;
  created_at: string;
};

// ─── Auth ─────────────────────────────────────────────────────────────────────

export type AuthFormData = {
  email: string;
  password: string;
};

// ─── Family ───────────────────────────────────────────────────────────────────

export type FamilyGroup = {
  id: string;
  name: string;
  created_by: string;
  created_at: string;
};

export type FamilyMember = {
  id: string;
  family_id: string;
  user_id: string;
  role: "admin" | "member";
  joined_at: string;
  profile?: Profile;
};

// ─── Profile ──────────────────────────────────────────────────────────────────

export type Profile = {
  id: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
};

// ─── API Response ─────────────────────────────────────────────────────────────

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string };
