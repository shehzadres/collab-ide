import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { authApi } from "../lib/api/auth.api";
import { useAuthStore } from "../store/authStore";
import { LoginPayload, RegisterPayload } from "../types/auth.types";

export function useAuth() {
  const navigate = useNavigate();
  const { user, isAuthenticated, setUser, setAccessToken, logout: clearStore } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async (payload: LoginPayload) => {
      setLoading(true);
      setError(null);
      try {
        const res = await authApi.login(payload);
        setUser(res.user);
        setAccessToken(res.accessToken);
        navigate("/sessions");
      } catch (err: any) {
        setError(err?.response?.data?.message || "Login failed");
      } finally {
        setLoading(false);
      }
    },
    [navigate, setUser, setAccessToken]
  );

  const register = useCallback(
    async (payload: RegisterPayload) => {
      setLoading(true);
      setError(null);
      try {
        const res = await authApi.register(payload);
        setUser(res.user);
        setAccessToken(res.accessToken);
        navigate("/sessions");
      } catch (err: any) {
        setError(err?.response?.data?.message || "Registration failed");
      } finally {
        setLoading(false);
      }
    },
    [navigate, setUser, setAccessToken]
  );

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      clearStore();
      navigate("/login");
    }
  }, [navigate, clearStore]);

  const bootstrap = useCallback(async () => {
    try {
      const { accessToken } = await authApi.refresh();
      setAccessToken(accessToken);
      const me = await authApi.me();
      setUser(me);
    } catch {
      clearStore();
    }
  }, [setAccessToken, setUser, clearStore]);

  return { user, isAuthenticated, loading, error, login, register, logout, bootstrap };
}
