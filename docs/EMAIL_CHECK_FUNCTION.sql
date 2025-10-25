-- ============================================
-- Email Uniqueness Check Function
-- ============================================
-- This function allows anonymous users to check if an email is already registered
-- without exposing any user data. Run this in your Supabase SQL Editor.
-- ============================================

-- Create function to check if email exists
CREATE OR REPLACE FUNCTION public.check_email_exists(check_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER  -- Run with elevated privileges
AS $$
DECLARE
    email_exists BOOLEAN;
BEGIN
    -- Normalize email (lowercase and trim)
    check_email := LOWER(TRIM(check_email));

    -- Check if email exists in profiles table
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE LOWER(TRIM(email)) = check_email
    ) INTO email_exists;

    RETURN email_exists;
END;
$$;

-- Add comment
COMMENT ON FUNCTION public.check_email_exists IS 'Checks if an email address is already registered. Returns true if email exists, false otherwise. Can be called by anonymous users.';

-- Grant execute permission to anonymous users and authenticated users
GRANT EXECUTE ON FUNCTION public.check_email_exists(TEXT) TO anon, authenticated;
