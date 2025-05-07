import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type User = {
  id?: number;
  name?: string;
  email?: string;
  dateOfBirth?: Date;
  phone?: string;
  verify?: boolean;
  image?: string;
  gender?: string;
  valid?: boolean;
  age?: number;
};

type UserStore = {
  user: User | null;
  setUser: (u: User) => void;
  clearUser: () => void;
};

export const useUserStore = create<UserStore>()(
    persist(
      (set) => ({
        user: null,
        setUser: (user) => set({ user }),
        clearUser: () => set({ user: null }),
      }),
      {
        name: 'user-storage',
        storage: createJSONStorage(() => AsyncStorage),
      }
    )
);