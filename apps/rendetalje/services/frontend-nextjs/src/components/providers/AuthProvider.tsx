"use client";

import { apiClient } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { User as AppUser } from "@/types";
import { User } from "@supabase/auth-helpers-nextjs";
import { createContext, useContext, useEffect, useState } from "react";

interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  signUp: (
    email: string,
    password: string,
    userData: Partial<AppUser>
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        await loadUserProfile(session.user);
        // Check if apiClient.setToken exists before calling
        if (typeof apiClient.setToken === "function") {
          apiClient.setToken(session.access_token);
        }
      }

      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        await loadUserProfile(session.user);
        // Check if apiClient.setToken exists before calling
        if (typeof apiClient.setToken === "function") {
          apiClient.setToken(session.access_token);
        }
      } else {
        setUser(null);
        if (typeof apiClient.setToken === "function") {
          apiClient.setToken("");
        }
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (authUser: User) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", authUser.id)
        .single();

      if (error) throw error;

      setUser(data as AppUser);
    } catch (error) {
      console.error("Error loading user profile:", error);
      setUser(null);
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    setUser(null);
    if (typeof apiClient.setToken === "function") {
      apiClient.setToken("");
    }
  };

  const signUp = async (
    email: string,
    password: string,
    userData: Partial<AppUser>
  ) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData,
      },
    });

    if (error) throw error;

    // Create user profile
    if (data.user) {
      const { error: profileError } = await supabase.from("users").insert({
        id: data.user.id,
        email: data.user.email,
        ...userData,
      });

      if (profileError) throw profileError;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    signUp,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
