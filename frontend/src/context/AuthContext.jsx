import { createContext, useContext, useEffect, useState } from "react";
import { api, clearToken, getToken, setToken } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Saat aplikasi dibuka, pulihkan sesi dari token yang tersimpan.
  useEffect(() => {
    if (!getToken()) {
      setLoading(false);
      return;
    }
    api("/auth/me")
      .then(setUser)
      .catch(() => clearToken())
      .finally(() => setLoading(false));
  }, []);

  async function login(username, password) {
    const res = await api("/auth/login", {
      method: "POST",
      body: { username, password },
    });
    setToken(res.access_token);
    setUser(res.user);
    return res;
  }

  async function logout() {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      // Token sudah tidak valid pun tetap lanjut bersihkan sisi klien.
    }
    clearToken();
    setUser(null);
  }

  async function selectRole(role) {
    const profile = await api("/auth/select-role", {
      method: "POST",
      body: { role },
    });
    setUser(profile);
    return profile;
  }

  const value = {
    user,
    loading,
    isLoggedIn: user !== null,
    needsRoleSelection: user !== null && user.active_role === null,
    login,
    logout,
    selectRole,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return ctx;
}
