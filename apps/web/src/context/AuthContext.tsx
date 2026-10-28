import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "../lib/supabase/client";
import { fetchProfile } from "../lib/supabase/api";
import { APP_URL } from "../lib/env";
import type { UserProfile } from "../lib/types";

/** Solo modo demo local (sin Supabase): simula haber iniciado sesión. */
const DEMO_SESSION_KEY = "parchexbogota-demo-session";

function readDemoSession(): boolean {
  try {
    return localStorage.getItem(DEMO_SESSION_KEY) === "1";
  } catch {
    return false;
  }
}

interface AuthContextValue {
  configured: boolean;
  loading: boolean;
  /** Visitante sin sesión: solo ve los planes por encima, sin poder abrirlos. */
  isGuest: boolean;
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  signInWithGoogle: () => Promise<void>;
  signInWithMicrosoft: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isSupabaseConfigured;
  const [loading, setLoading] = useState(configured);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [demoSession, setDemoSession] = useState<boolean>(() => !configured && readDemoSession());
  const isGuest = configured ? !loading && !session : !demoSession;

  const startDemoSession = useCallback(() => {
    try {
      localStorage.setItem(DEMO_SESSION_KEY, "1");
    } catch {
      /* sin almacenamiento: la sesión demo dura hasta recargar */
    }
    setDemoSession(true);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (!session?.user?.id) {
      setProfile(null);
      return;
    }
    const p = await fetchProfile(session.user.id);
    setProfile(p);
  }, [session?.user?.id]);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setLoading(false);
      return;
    }

    sb.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: sub } = sb.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session?.user?.id) void refreshProfile();
    else setProfile(null);
  }, [session?.user?.id, refreshProfile]);

  const redirectTo = APP_URL;

  const signInWithGoogle = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) {
      startDemoSession();
      return;
    }
    const { error } = await sb.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, queryParams: { prompt: "select_account" } },
    });
    if (error) throw error;
  }, [redirectTo, startDemoSession]);

  const signInWithMicrosoft = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) {
      startDemoSession();
      return;
    }
    const { error } = await sb.auth.signInWithOAuth({
      provider: "azure",
      options: {
        redirectTo,
        scopes: "email profile openid",
      },
    });
    if (error) throw error;
  }, [redirectTo, startDemoSession]);

  const signInWithApple = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) {
      startDemoSession();
      return;
    }
    const { error } = await sb.auth.signInWithOAuth({
      provider: "apple",
      options: { redirectTo },
    });
    if (error) throw error;
  }, [redirectTo, startDemoSession]);

  const signOut = useCallback(async () => {
    const sb = getSupabase();
    if (!sb) {
      try {
        localStorage.removeItem(DEMO_SESSION_KEY);
      } catch {
        /* nada que limpiar */
      }
      setDemoSession(false);
      return;
    }
    await sb.auth.signOut();
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        configured,
        loading,
        isGuest,
        session,
        user: session?.user ?? null,
        profile,
        signInWithGoogle,
        signInWithMicrosoft,
        signInWithApple,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
