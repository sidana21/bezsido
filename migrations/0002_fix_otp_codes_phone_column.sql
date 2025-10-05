-- Migration to fix otp_codes table: rename email column to phone if exists
DO $$
BEGIN
  -- Check if otp_codes table has email column but not phone column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'otp_codes' AND column_name = 'email'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'otp_codes' AND column_name = 'phone'
  ) THEN
    -- Rename email column to phone
    ALTER TABLE otp_codes RENAME COLUMN email TO phone;
    RAISE NOTICE 'Renamed otp_codes.email to otp_codes.phone';
  ELSE
    RAISE NOTICE 'otp_codes table already has phone column or does not have email column';
  END IF;
END $$;
--> statement-breakpoint

-- Add phone column to users table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'phone'
  ) THEN
    ALTER TABLE users ADD COLUMN phone VARCHAR UNIQUE;
    RAISE NOTICE 'Added phone column to users table';
  ELSE
    RAISE NOTICE 'users table already has phone column';
  END IF;
END $$;
--> statement-breakpoint

-- Add verification_type column to users table if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'verification_type'
  ) THEN
    ALTER TABLE users ADD COLUMN verification_type TEXT;
    RAISE NOTICE 'Added verification_type column to users table';
  ELSE
    RAISE NOTICE 'users table already has verification_type column';
  END IF;
END $$;
