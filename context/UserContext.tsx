import React, { createContext, useContext, useState, ReactNode } from 'react';

export type User = {
  id?: number;
  name?: string;
  email?: string;
  dateOfBirth?: Date;
  gender?: string;
  phone?: string;
  verify?: boolean;
  image?: string;
  valid?: boolean;
  age?: number;
  confirmationResult?: any;
  isPhoneVerified?: boolean;
  isEmailVerified?: boolean;
  token?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  // añade más campos según los necesites
};

type UserContextType = {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User>>;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User>({});

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
};

// Hook para usar el contexto en cualquier pantalla
export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used inside a UserProvider");
  return context;
};
