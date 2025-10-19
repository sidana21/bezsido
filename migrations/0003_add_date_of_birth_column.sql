-- Migration: Add date_of_birth column to users table
-- This fixes the error: column "date_of_birth" does not exist

-- Add date_of_birth column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'users' 
        AND column_name = 'date_of_birth'
    ) THEN
        ALTER TABLE users ADD COLUMN date_of_birth TIMESTAMP;
        RAISE NOTICE 'Column date_of_birth added successfully';
    ELSE
        RAISE NOTICE 'Column date_of_birth already exists';
    END IF;
END $$;
