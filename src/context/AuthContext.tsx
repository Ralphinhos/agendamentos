import React, { createContext, useContext, useState, useEffect, useMemo } from "react";

type Role = "admin" | "editor";

interface AuthContextValue {
  role: Role | null;
  login: (role: Role) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = "ead-auth-role-v1";

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<Role | null>(() => {
    // Initialize role directly from localStorage
    try {
      return localStorage.getItem(STORAGE_KEY) as Role | null;
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState(false); // No longer need initial loading state

  const login = (newRole: Role) => {
    setRole(newRole);
    localStorage.setItem(STORAGE_KEY, newRole);
  };

  const logout = () => {
    setRole(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(() => ({ role, login, logout, isLoading }), [role, isLoading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
