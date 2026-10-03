import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { api } from "../api/eventix";
import type { AuthResponse, User } from "../types/api";

interface AuthContextValue {
  user: User | null;
  isReady: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (name: string, email: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const USER_KEY = "eventix_user";

const storedUser = (): User | null => {
  try {
    const value = localStorage.getItem(USER_KEY);
    return value ? (JSON.parse(value) as User) : null;
  } catch {
    return null;
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(storedUser);
  const [isReady, setIsReady] = useState(() => !localStorage.getItem("eventix_token"));

  const logout = useCallback(() => {
    localStorage.removeItem("eventix_token");
    localStorage.removeItem(USER_KEY);
    setUser(null);
  }, []);

  const saveSession = useCallback((result: AuthResponse) => {
    localStorage.setItem("eventix_token", result.token);
    localStorage.setItem(USER_KEY, JSON.stringify(result.user));
    setUser(result.user);
    return result.user;
  }, []);

  const login = useCallback(
    async (email: string, password: string) =>
      saveSession(await api.login(email, password)),
    [saveSession],
  );
  const register = useCallback(
    async (name: string, email: string, password: string) =>
      saveSession(await api.register(name, email, password)),
    [saveSession],
  );

  useEffect(() => {
    const handleUnauthorized = () => logout();
    window.addEventListener("eventix:unauthorized", handleUnauthorized);
    return () =>
      window.removeEventListener("eventix:unauthorized", handleUnauthorized);
  }, [logout]);

  useEffect(() => {
    const token = localStorage.getItem("eventix_token");
    if (!token) return;
    let active = true;
    api.me()
      .then((verifiedUser) => {
        if (!active) return;
        localStorage.setItem(USER_KEY, JSON.stringify(verifiedUser));
        setUser(verifiedUser);
      })
      .catch(() => { if (active) logout(); })
      .finally(() => { if (active) setIsReady(true); });
    return () => { active = false; };
  }, [logout]);

  const value = useMemo(
    () => ({
      user,
      isReady,
      isAuthenticated: Boolean(user),
      isAdmin: user?.role === "ADMIN",
      login,
      register,
      logout,
    }),
    [user, isReady, login, register, logout],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
