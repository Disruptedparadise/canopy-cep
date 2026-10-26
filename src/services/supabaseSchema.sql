-- RootGuard Supabase Database Schema
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor) to initialize the tables

-- 1. Create trees table
CREATE TABLE IF NOT EXISTS public.trees (
    tree_id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    species_id TEXT,
    species_name TEXT NOT NULL,
    planter_name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    date_planted TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'healthy',
    soil_type TEXT NOT NULL DEFAULT 'loamy',
    slope TEXT NOT NULL DEFAULT 'gentle',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create checkins table (one-to-many with trees)
CREATE TABLE IF NOT EXISTS public.checkins (
    id TEXT PRIMARY KEY,
    tree_id TEXT NOT NULL REFERENCES public.trees(tree_id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    status TEXT NOT NULL,
    note TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create photos table (one-to-many with trees)
CREATE TABLE IF NOT EXISTS public.photos (
    id TEXT PRIMARY KEY,
    tree_id TEXT NOT NULL REFERENCES public.trees(tree_id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    date TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_trees_user_id ON public.trees(user_id);
CREATE INDEX IF NOT EXISTS idx_trees_species_name ON public.trees(species_name);
CREATE INDEX IF NOT EXISTS idx_checkins_tree_id ON public.checkins(tree_id);
CREATE INDEX IF NOT EXISTS idx_photos_tree_id ON public.photos(tree_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.trees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------
-- Hardened Row Level Security (RLS) Policies
-- ----------------------------------------------------
-- Note on Guest Mode Submissions:
-- Guest-mode submissions without an active Supabase Auth session (auth.uid() IS NULL)
-- will be rejected by direct client anon-key writes under these policies. To support
-- guest contributions safely, route guest submissions through a backend server-side
-- endpoint with rate-limiting, CAPTCHA, or server-role validation rather than allowing
-- anonymous write access via the public anon key.

-- Drop legacy open policies if they exist
DROP POLICY IF EXISTS "Anyone can insert trees" ON public.trees;
DROP POLICY IF EXISTS "Anyone can update trees" ON public.trees;
DROP POLICY IF EXISTS "Anyone can insert checkins" ON public.checkins;
DROP POLICY IF EXISTS "Anyone can insert photos" ON public.photos;

-- 1. TREES POLICIES
-- Public transparency: Anyone (including anonymous visitors) can view trees
CREATE POLICY "Public trees are viewable by everyone" 
ON public.trees FOR SELECT USING (true);

-- Authenticated insertion: Requires logged-in user session
CREATE POLICY "Authenticated users can insert trees" 
ON public.trees FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()));

-- Owner-only updates: Users can only modify trees they themselves planted/logged
CREATE POLICY "Users can only update their own logged trees" 
ON public.trees FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. CHECKINS POLICIES
-- Public transparency: Anyone can view survival check-ins
CREATE POLICY "Public checkins are viewable by everyone" 
ON public.checkins FOR SELECT USING (true);

-- Authenticated insertion: Requires logged-in user session
CREATE POLICY "Authenticated users can insert checkins" 
ON public.checkins FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);

-- 3. PHOTOS POLICIES
-- Public transparency: Anyone can view tree photos
CREATE POLICY "Public photos are viewable by everyone" 
ON public.photos FOR SELECT USING (true);

-- Authenticated insertion: Requires logged-in user session
CREATE POLICY "Authenticated users can insert photos" 
ON public.photos FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() IS NOT NULL);
