import { create } from 'zustand';
import api from '../utils/api';

const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  hydrated: false,

  init: () => {
    if (typeof window === 'undefined') return;
    // Prevent double-init
    if (get().hydrated) return;
    const token = localStorage.getItem('nb_token');
    const userStr = localStorage.getItem('nb_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        set({ token, user, isAuthenticated: true, hydrated: true });
      } catch {
        localStorage.removeItem('nb_token');
        localStorage.removeItem('nb_user');
        set({ hydrated: true });
      }
    } else {
      set({ hydrated: true });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;
      localStorage.setItem('nb_token', token);
      localStorage.setItem('nb_user', JSON.stringify(user));
      set({ token, user, isAuthenticated: true, isLoading: false, hydrated: true });
      return { success: true };
    } catch (err) {
      set({ isLoading: false });
      return { success: false, error: err.response?.data?.error || 'Login failed' };
    }
  },

  register: async (name, email, password, monthlyIncome) => {
    set({ isLoading: true });
    try {
      const res = await api.post('/auth/register', { name, email, password, monthlyIncome });
      const { token, user } = res.data;
      localStorage.setItem('nb_token', token);
      localStorage.setItem('nb_user', JSON.stringify(user));
      set({ token, user, isAuthenticated: true, isLoading: false, hydrated: true });
      return { success: true };
    } catch (err) {
      set({ isLoading: false });
      return { success: false, error: err.response?.data?.error || 'Registration failed' };
    }
  },

  logout: () => {
    localStorage.removeItem('nb_token');
    localStorage.removeItem('nb_user');
    set({ user: null, token: null, isAuthenticated: false, hydrated: true });
    window.location.href = '/login';
  },

  updateUser: (user) => {
    localStorage.setItem('nb_user', JSON.stringify(user));
    set({ user });
  },
}));

export default useAuthStore;
