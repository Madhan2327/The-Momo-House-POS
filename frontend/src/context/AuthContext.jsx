import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // On first load, trust an existing token/user pair already in localStorage
  // (avoids forcing a re-login every page refresh).
  useEffect(() => {
    const token = localStorage.getItem("momo_token");
    const savedUser = localStorage.getItem("momo_user");
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem("momo_token");
        localStorage.removeItem("momo_user");
      }
    }
    setIsLoading(false);
  }, []);

  // Returns true/false so Login.jsx's existing `if (login(...))` pattern
  // keeps working — the actual API call happens here now, not in the component.
  const login = async (username, password) => {
    try {
      const data = await api.login(username, password);
      localStorage.setItem("momo_token", data.token);
      localStorage.setItem("momo_user", JSON.stringify(data.user));
      setUser(data.user);
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("momo_token");
    localStorage.removeItem("momo_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
