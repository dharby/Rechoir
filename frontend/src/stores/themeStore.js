import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useThemeStore = create(
  persist(
    (set, get) => ({
      isDark: true,
      toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
      setTheme: (isDark) => set({ isDark }),
    }),
    {
      name: 'rechoir-theme',
    }
  )
);

export const getThemeColors = (isDark) => ({
  bg: isDark ? '#0f172a' : '#f8fafc',
  surface: isDark ? '#1e293b' : '#ffffff',
  surfaceHover: isDark ? '#334155' : '#f1f5f9',
  primary: '#1e40af',
  primaryHover: '#1e3a8a',
  secondary: '#d97706',
  accent: '#059669',
  text: isDark ? '#f8fafc' : '#0f172a',
  textSecondary: isDark ? '#94a3b8' : '#64748b',
  border: isDark ? '#334155' : '#e2e8f0',
  error: '#dc2626',
  warning: '#f59e0b',
  success: '#059669',
  gradient: isDark 
    ? 'linear-gradient(135deg, #1e40af 0%, #7c3aed 50%, #d97706 100%)'
    : 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #f59e0b 100%)',
});

export default useThemeStore;