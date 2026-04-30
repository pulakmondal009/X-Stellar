-- =============================================
-- Stellar-Star: Supabase Database Schema Setup
-- =============================================

-- Users table
CREATE TABLE IF NOT EXISTS public.users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ DEFAULT NOW()
);

-- Expenses table
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  total_amount TEXT NOT NULL,
  split_mode TEXT NOT NULL DEFAULT 'equal',
  members JSONB NOT NULL DEFAULT '[]',
  shares JSONB NOT NULL DEFAULT '[]',
  paid_by_member_id TEXT NOT NULL,
  settled BOOLEAN DEFAULT FALSE,
  trip_id TEXT,
  user_wallet_address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trips table
CREATE TABLE IF NOT EXISTS public.trips (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  members JSONB NOT NULL DEFAULT '[]',
  expense_ids JSONB NOT NULL DEFAULT '[]',
  settled BOOLEAN DEFAULT FALSE,
  user_wallet_address TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_expenses_wallet ON public.expenses(user_wallet_address);
CREATE INDEX IF NOT EXISTS idx_expenses_trip ON public.expenses(trip_id);
CREATE INDEX IF NOT EXISTS idx_trips_wallet ON public.trips(user_wallet_address);
CREATE INDEX IF NOT EXISTS idx_users_wallet ON public.users(wallet_address);

-- RLS Policies (enable Row Level Security)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- Users: anon can read/insert/update own wallet
DROP POLICY IF EXISTS "users_select" ON public.users;
DROP POLICY IF EXISTS "users_insert" ON public.users;
DROP POLICY IF EXISTS "users_update" ON public.users;
CREATE POLICY "users_select" ON public.users FOR SELECT USING (true);
CREATE POLICY "users_insert" ON public.users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_update" ON public.users FOR UPDATE USING (true);

-- Expenses: wallet-address scoped via header
DROP POLICY IF EXISTS "expenses_select" ON public.expenses;
DROP POLICY IF EXISTS "expenses_insert" ON public.expenses;
DROP POLICY IF EXISTS "expenses_update" ON public.expenses;
DROP POLICY IF EXISTS "expenses_delete" ON public.expenses;
CREATE POLICY "expenses_select" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "expenses_insert" ON public.expenses FOR INSERT WITH CHECK (true);
CREATE POLICY "expenses_update" ON public.expenses FOR UPDATE USING (true);
CREATE POLICY "expenses_delete" ON public.expenses FOR DELETE USING (true);

-- Trips: same open policy (wallet-scoping done in application layer)
DROP POLICY IF EXISTS "trips_select" ON public.trips;
DROP POLICY IF EXISTS "trips_insert" ON public.trips;
DROP POLICY IF EXISTS "trips_update" ON public.trips;
DROP POLICY IF EXISTS "trips_delete" ON public.trips;
CREATE POLICY "trips_select" ON public.trips FOR SELECT USING (true);
CREATE POLICY "trips_insert" ON public.trips FOR INSERT WITH CHECK (true);
CREATE POLICY "trips_update" ON public.trips FOR UPDATE USING (true);
CREATE POLICY "trips_delete" ON public.trips FOR DELETE USING (true);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
