import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserRole } from '@/types';
import { getAuthErrorMessage } from '@/lib/auth-errors';

interface AthleteAccessCheck {
  is_registered: boolean;
  athlete_id: string | null;
  club_id: string | null;
  role: UserRole;
}

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

  const fetchUserData = useCallback(async (userId: string, email: string): Promise<AuthUser | null> => {
    try {
      const { data: accessCheck, error: accessError } = await supabase
        .rpc('check_user_athlete_access' as any, { _user_id: userId }) as { data: AthleteAccessCheck[] | null; error: any };

      if (accessError) {
        console.error('Error checking user access:', accessError);
      }

      const access = accessCheck?.[0];
      
      if (access && !access.is_registered && access.role === 'athlete') {
        console.error('User is not a registered athlete');
        await supabase.auth.signOut();
        return null;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
      }

      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role, club_id')
        .eq('user_id', userId)
        .maybeSingle();

      if (roleError) {
        console.error('Error fetching role:', roleError);
      }

      return {
        id: userId,
        name: profile?.name || email,
        email: profile?.email || email,
        role: (roleData?.role as UserRole) || (access?.role as UserRole) || 'athlete',
        clubId: (roleData as any)?.club_id || access?.club_id || undefined,
        athleteId: access?.athlete_id || undefined,
      };
    } catch (error) {
      console.error('Error in fetchUserData:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        setSession(currentSession);
        
        if (currentSession?.user) {
          setTimeout(() => {
            fetchUserData(currentSession.user.id, currentSession.user.email || '')
              .then(userData => {
                setUser(userData);
                setIsLoading(false);
              });
          }, 0);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      if (existingSession?.user) {
        fetchUserData(existingSession.user.id, existingSession.user.email || '')
          .then(userData => {
            setUser(userData);
            setIsLoading(false);
          });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
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
        const { data: accessCheck } = await supabase
          .rpc('check_user_athlete_access' as any, { _user_id: data.user.id }) as { data: AthleteAccessCheck[] | null };

        const access = accessCheck?.[0];
        
        if (access && !access.is_registered && access.role === 'athlete') {
          await supabase.auth.signOut();
          return { 
            success: false, 
            error: 'Apenas atletas cadastrados podem acessar o sistema. Entre em contato com o administrador.' 
          };
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
      // Check if email exists in athletes table (REQUIRED for all users except super_admin)
      if (role !== 'super_admin') {
        const { data: athleteData, error: athleteError } = await supabase
          .from('athletes')
          .select('email')
          .eq('email', email.trim())
          .maybeSingle();

        if (athleteError) {
          console.error('Error checking athlete:', athleteError);
          return { success: false, error: 'Erro ao verificar cadastro.' };
        }

        if (!athleteData) {
          return { 
            success: false, 
            error: 'Email não encontrado. Entre em contato com o administrador para ser adicionado ao clube.' 
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
        isAdmin: user?.role === 'admin' || user?.role === 'club_admin' || user?.role === 'super_admin',
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
