import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types';
import { getAuthErrorMessage } from '@/lib/auth-errors';
import { isAdminRole, isCoach, canMutate } from '@/lib/permissions';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  clubId?: string;
  athleteId?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isCoach: boolean;
  canMutate: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, name: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (password: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const initialAuthChecked = useRef(false);

  const fetchUserData = useCallback(async (userId: string, email: string): Promise<AuthUser | null> => {
    try {
      console.log('🔍 Fetching user data for userId:', userId);
      
      // Fetch user role and club_id from user_roles table
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role, club_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError) {
        console.error('Error fetching role:', roleError);
      }

      console.log('📊 Role data from database:', roleData);

      // Fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        // A missing profile is a critical error that prevents the app from working
        await supabase.auth.signOut();
        return null;
      }

      if (!profile) {
        console.error('CRITICAL: User profile not found for userId:', userId);
        // Sign out the user if the profile is missing, as the app cannot function.
        await supabase.auth.signOut();
        return null;
      }

      const role = (roleData?.role as UserRole) || 'athlete';

      // Validate that the user still has an ACTIVE record (not soft-deleted)
      // Admins/super_admins are not bound to athletes/coaches tables
      let athleteData: { id: string } | null = null;
      if (role === 'athlete' || role === 'coach') {
        const normalizedEmail = (profile?.email || email).trim().toLowerCase();

        // Validate email is not empty
        if (!normalizedEmail) {
          console.error('Email is empty, cannot validate user');
          await supabase.auth.signOut();
          return null;
        }

        // Query both tables in parallel - single call per table instead of RPC
        const [{ data: athlete }, { data: coach }] = await Promise.all([
          supabase
            .from('athletes')
            .select('id')
            .eq('email', normalizedEmail)
            .is('deleted_at', null)
            .maybeSingle(),
          supabase
            .from('coaches')
            .select('id')
            .eq('email', normalizedEmail)
            .is('deleted_at', null)
            .maybeSingle(),
        ]);

        // Verify user has active record in at least one table
        if (!athlete && !coach) {
          console.error('User account was removed by an administrator');
          await supabase.auth.signOut();
          return null;
        }

        // Verify user's claimed role matches an active record
        if (role === 'athlete' && !athlete) {
          console.error('Athlete record not found or has been deleted');
          await supabase.auth.signOut();
          return null;
        }

        if (role === 'coach' && !coach) {
          console.error('Coach record not found or has been deleted');
          await supabase.auth.signOut();
          return null;
        }

        athleteData = athlete;
      }

      return {
        id: userId,
        name: profile?.name || email,
        email: profile?.email || email,
        role,
        clubId: roleData?.club_id || undefined,
        athleteId: athleteData?.id || undefined,
      };
    } catch (error) {
      console.error('Error in fetchUserData:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    const handleAuthChange = async (session: Session | null) => {
      if (session?.user) {
        const userData = await fetchUserData(session.user.id, session.user.email || '');
        setUser(userData);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    // Initial check
    if (!initialAuthChecked.current) {
      initialAuthChecked.current = true;
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session);
        handleAuthChange(session);
      });
    }

    // Listen for subsequent changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        // The initial check handles the first load, so this listener only
        // needs to react to subsequent changes.
        if (event !== 'INITIAL_SESSION') {
          setSession(currentSession);
          handleAuthChange(currentSession);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        return { success: false, error: getAuthErrorMessage(error) };
      }

      if (data.user) {
        // Check user's role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', data.user.id)
          .maybeSingle();

        const role = roleData?.role as UserRole | undefined;

        // Admins/super_admins bypass athlete/coach membership check
        const isAdminLike = role === 'admin' || role === 'club_admin' || role === 'super_admin';

        if (!isAdminLike) {
          const normalizedEmail = data.user.email!.trim().toLowerCase();

          // Use SECURITY DEFINER RPCs that already filter out soft-deleted records
          const [{ data: athleteActive }, { data: coachActive }] = await Promise.all([
            supabase.rpc('check_athlete_email_exists', { p_email: normalizedEmail }),
            (supabase as any).rpc('check_coach_email_exists', { p_email: normalizedEmail }),
          ]);

          if (!athleteActive && !coachActive) {
            await supabase.auth.signOut();
            return {
              success: false,
              error: 'Sua conta foi removida pelo administrador. Entre em contato com o clube para mais informações.',
            };
          }
        }
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: getAuthErrorMessage(error) };
    }
  };

  const signup = async (
    email: string,
    password: string,
    name: string,
    role: UserRole = 'athlete'
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      // Check if email exists in athletes OR coaches (REQUIRED for all users except super_admin)
      // Uses RPC functions with SECURITY DEFINER to bypass RLS
      if (role !== 'super_admin') {
        const normalizedEmail = email.trim().toLowerCase();

        const [{ data: athleteExists, error: athleteErr }, { data: coachExists, error: coachErr }] =
          await Promise.all([
            supabase.rpc('check_athlete_email_exists', { p_email: normalizedEmail }),
            (supabase as any).rpc('check_coach_email_exists', { p_email: normalizedEmail }),
          ]);

        if (athleteErr || coachErr) {
          console.error('Error checking signup eligibility:', athleteErr || coachErr);
          return { success: false, error: 'Erro ao verificar cadastro.' };
        }

        if (!athleteExists && !coachExists) {
          return {
            success: false,
            error: 'E-mail não encontrado. Entre em contato com o administrador para ser adicionado ao clube.',
          };
        }
      }

      const redirectUrl = `${window.location.origin}/`;

      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            name: name.trim(),
            role,
          },
        },
      });

      if (error) {
        return { success: false, error: getAuthErrorMessage(error) };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: getAuthErrorMessage(error) };
    }
  };

  const logout = async (): Promise<void> => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const forgotPassword = async (email: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const redirectUrl = `${window.location.origin}/?mode=reset-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: redirectUrl,
      });

      if (error) {
        return { success: false, error: getAuthErrorMessage(error) };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: getAuthErrorMessage(error) };
    }
  };

  const resetPassword = async (password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        return { success: false, error: getAuthErrorMessage(error) };
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: getAuthErrorMessage(error) };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isLoading,
        isAuthenticated: !!session && !!user,
        isAdmin: isAdminRole(user?.role),
        isCoach: isCoach(user?.role),
        canMutate: canMutate(user?.role),
        login,
        signup,
        logout,
        forgotPassword,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
