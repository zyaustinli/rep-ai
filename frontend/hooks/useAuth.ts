import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check active session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);

        if (event === 'SIGNED_IN') {
          router.push('/dashboard');
        } else if (event === 'SIGNED_OUT') {
          router.push('/login');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email already exists using the secure database function
    // This prevents duplicate registrations when email confirmation is enabled
    const { data: emailExists, error: checkError } = await supabase
      .rpc('check_email_exists', { check_email: normalizedEmail });

    if (checkError) {
      // If the function doesn't exist yet, continue with signup
      // (for backwards compatibility during deployment)
      console.warn('Email check function not available:', checkError);
    } else if (emailExists === true) {
      // Email is already registered
      throw new Error('An account with this email already exists. Please sign in instead.');
    }

    // Proceed with signup if email doesn't exist
    const { error } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    // Handle Supabase signup errors
    if (error) {
      // Check for common Supabase error messages for duplicate emails
      if (error.message.includes('already registered') ||
          error.message.includes('already been registered') ||
          error.message.includes('duplicate')) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return {
    user,
    loading,
    signIn,
    signUp,
    signOut,
  };
}
