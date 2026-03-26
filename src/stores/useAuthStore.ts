import { create } from "zustand";
import type { UserRole } from "@/types/game";

export interface AuthUser {
  id: number;
  email: string;
  role: UserRole;
}

interface AuthState {
  currentUser: AuthUser | null;
  isAuthenticated: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  setCurrentUser: (user: AuthUser | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  currentUser: null,
  isAuthenticated: false,

  login: (user: AuthUser) => {
    set({
      currentUser: user,
      isAuthenticated: true,
    });
    // Optionally persist to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("currentUser", JSON.stringify(user));
    }
  },

  logout: () => {
    set({
      currentUser: null,
      isAuthenticated: false,
    });
    if (typeof window !== "undefined") {
      localStorage.removeItem("currentUser");
    }
  },

  setCurrentUser: (user: AuthUser | null) => {
    set({
      currentUser: user,
      isAuthenticated: user !== null,
    });
    if (user && typeof window !== "undefined") {
      localStorage.setItem("currentUser", JSON.stringify(user));
    }
  },
}));
