import { create } from "zustand";

export interface User {
  public_id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
  is_admin: boolean;
  region_name: string;
  job_name: string;
  subscribed: boolean;
  in_trial: boolean;
}

interface AuthStore {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isInitialized: boolean;

  setAuth: (token: string, user: User) => void;
  setUser: (user: User) => void;
  logout: (options?: { silent?: boolean }) => void;
  initialize: () => void;
}

let isLoggingOut = false;

export const useAuthStore = create<AuthStore>((set, get) => ({
  token: null,
  user: null,
  isLoading: false,
  isInitialized: false,

  initialize: () => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");
    const userString = localStorage.getItem("user");

    let user = null;

    try {
      if (userString && userString !== "undefined") {
        user = JSON.parse(userString);
      }
    } catch {
      user = null;
    }

    set({
      token,
      user,
      isInitialized: true,
    });
  },

  setAuth: (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));

    set({
      token,
      user,
      isLoading: false,
    });
  },

  setUser: (user) => {
    localStorage.setItem("user", JSON.stringify(user));

    set({
      user,
    });
  },

  logout: (options = {}) => {
    if (isLoggingOut) return;

    isLoggingOut = true;

    const wasAdmin = get().user?.is_admin === true;

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    set({
      token: null,
      user: null,
      isLoading: false,
    });

    if (!options.silent) {
      window.location.href = wasAdmin ? "/admin/login" : "/login";
    }

    isLoggingOut = false;
  },
}));
