import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CompanionRequest, EmergencyContact, ExternalContact } from '@/api/backend/types';
import { SafeLocation } from '@/api/backend/locations/locationType';
import { getCurrentUser } from '../../api/backend/user/userApi';
import { Group } from '@/api/backend/group/groupType';

export enum ValidationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED'
}

export type User = {
  id?: number;
  name?: string;
  email?: string;
  dateOfBirth?: Date;
  phone?: string;
  verify?: ValidationStatus;
  image?: string;
  gender?: string;
  valid?: boolean;
  age?: number;
  acceptedPrivacyPolicy?: boolean;
  emergencyContacts?: EmergencyContact[];
  externalContacts?: ExternalContact[];
  safeLocations?: SafeLocation[];
  groups?: Group[];
  idClerk?: string; // ID de usuario en Clerk
  role?: "USER" | "ADMIN";
  companionRequestsCreated?: CompanionRequest[];
  companionRequestsAccepted?: CompanionRequest[];
};

type UserStore = {
  user: User | null;
  setUser: (u: User) => void;
  clearUser: () => void;
  refreshUserFromBackend: () => Promise<void>;
};

export const useUserStore = create<UserStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      clearUser: () => set({ user: null }),

      refreshUserFromBackend: async () => {
        try {
          const user = await getCurrentUser(); // ← Usas directamente tu API
          set({ user });
        } catch (err) {
          console.error('Error al refrescar usuario:', err);
        }
      },
    }),
    {
      name: 'user-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);