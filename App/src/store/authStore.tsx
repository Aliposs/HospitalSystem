import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
    accessToken: string | null;
    user: {id: number; email: string; role: string; fullName: string} | null;
    setAuth: (token: string, userData: any) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>(
    persist(
        (set) => ({
            accessToken: null,
            user: null,
            setAuth: (token, userData) => set({ accessToken: token, user: userData }),
            logout: () => {
                // Clear userRole from localStorage
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('userRole');
                }
                set({ accessToken: null, user: null });
            },
        }),
        {
            name: 'auth-store',
            storage: typeof window !== 'undefined' ? localStorage : undefined,
        }
    )
);