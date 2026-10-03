import { create } from "zustand";

interface AuthState {
  token: string | null;
  role: string | null;
  setAuth: (token: string, role: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: typeof window !== "undefined" ? localStorage.getItem("token") : null,
  role: typeof window !== "undefined" ? localStorage.getItem("role") : null,
  setAuth: (token, role) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    set({ token, role });
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    set({ token: null, role: null });
  },
}));
