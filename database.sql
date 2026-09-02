-- GutoSynth: Database Schema
-- Tracks and project sessions stored for collaborative & cloud persistence

CREATE TABLE IF NOT EXISTS public.synth_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL DEFAULT 'Untitled Gesture Track',
    bpm INTEGER NOT NULL DEFAULT 120,
    scale VARCHAR(50) NOT NULL DEFAULT 'minor',
    root_note VARCHAR(10) NOT NULL DEFAULT 'C',
    tracks_data JSONB NOT NULL DEFAULT '[]'::jsonb,
    instruments_config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Row Level Security (RLS)
ALTER TABLE public.synth_projects ENABLE ROW LEVEL SECURITY;

-- Allow public read & write for anonymous gesture session storage
CREATE POLICY "Allow public read access" ON public.synth_projects
    FOR SELECT USING (true);

CREATE POLICY "Allow public insert access" ON public.synth_projects
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update access" ON public.synth_projects
    FOR UPDATE USING (true);
