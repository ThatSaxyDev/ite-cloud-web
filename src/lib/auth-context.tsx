import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { authClient } from "./auth-client";
import { api, type Entitlements } from "./api";
import { config } from "./config";
import { getDevAuthUser } from "./dev-auth";

export type AuthUser = {
  id: string;
  email?: string;
  name?: string;
  image?: string | null;
};

type AuthState = {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: AuthUser | null;
  entitlements: Entitlements | null;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [entitlements, setEntitlements] = useState<Entitlements | null>(null);

  const resolveAuth = useCallback(async () => {
    setIsLoading(true);

    const devUser = getDevAuthUser();
    if (devUser) {
      setUser({
        id: "dev",
        email: devUser.email,
        name: devUser.name,
        image: devUser.image,
      });
      setEntitlements(null);
      setIsLoading(false);
      return;
    }

    try {
      const session = await authClient.getSession();
      if (!session.data?.session || !session.data?.user) {
        setUser(null);
        setEntitlements(null);
        setIsLoading(false);
        return;
      }

      const sessionUser = session.data.user;
      const authUser: AuthUser = {
        id: sessionUser.id,
        email: sessionUser.email,
        name: sessionUser.name,
        image: (sessionUser as { image?: string | null }).image ?? null,
      };
      setUser(authUser);

      try {
        const me = await api.me();
        if (me.ok && me.entitlements) {
          setEntitlements(me.entitlements);
        }
      } catch {
        // entitlements are non-critical; user is already set
      }
    } catch {
      setUser(null);
      setEntitlements(null);
    }

    setIsLoading(false);
  }, []);

  useEffect(() => {
    void resolveAuth();
  }, [resolveAuth]);

  const signOut = useCallback(async () => {
    const devUser = getDevAuthUser();
    if (devUser) {
      setUser(null);
      setEntitlements(null);
      return;
    }

    try {
      await authClient.signOut();
      await fetch(`${config.apiUrl}/auth/logout-browser`, {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Continue with local cleanup even if network calls fail.
    }

    setUser(null);
    setEntitlements(null);
  }, []);

  const value: AuthState = {
    isLoading,
    isAuthenticated: user !== null,
    user,
    entitlements,
    signOut,
    refresh: resolveAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
