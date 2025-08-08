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
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedRole = localStorage.getItem(STORAGE_KEY) as Role | null;
      if (storedRole) {
        setRole(storedRole);
      }
    } catch (e) {
      console.error("Failed to read auth role from storage", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (newRole: Role) => {
    setRole(newRole);
    localStorage.setItem(STORAGE_KEY, newRole);
  };

  const logout = () => {
    setRole(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const value = useMemo(() => ({ role, login, logout, isLoading }), [role, isLoading]);

  // Render children only after loading the role from storage
  return (
    <AuthContext.Provider value={value}>
      {!isLoading && children}
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
