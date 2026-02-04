-- Migration script to add missing columns to the resumes table
-- Run this in your Supabase SQL Editor

-- Add languages column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resumes' AND column_name='languages') THEN
        ALTER TABLE public.resumes ADD COLUMN languages JSONB DEFAULT '[]';
    END IF;
END $$;

-- Add volunteer column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='resumes' AND column_name='volunteer') THEN
        ALTER TABLE public.resumes ADD COLUMN volunteer JSONB DEFAULT '[]';
    END IF;
END $$;

-- Add comment to the table to track version/updates
COMMENT ON TABLE public.resumes IS 'Resumes table with updated schema including languages and volunteer sections';
