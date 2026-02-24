import {create} from 'zustand';

interface AuthState {
    accessToken: string | null;
    user: {id: number; email: string; role: string; fullName: string} | null;
    setAuth: (token: string, userData: any) => void;
    logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    accessToken: null,
    user: null,
    setAuth: (token, userData) => set({ accessToken: token, user: userData}),
    logout: () => set({ accessToken: null, user: null}), 
}));