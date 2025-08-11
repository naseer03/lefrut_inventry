import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string;
  role: string;
  permissions: string[] | Array<{
    module: string;
    actions: string[];
  }>;
  staffInfo?: {
    id: string;
    fullName: string;
    employeeId: string;
    mobileNumber: string;
    email: string;
    jobRoles: Array<{
      _id: string;
      name: string;
    }>;
    isDriver: boolean;
    hasActiveTrip?: boolean;
  };
  truckInfo?: {
    id: string;
    truckId: string;
    vehicleNumber: string;
    capacity: number;
  };
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  hasPermission: (module: string, action: string) => boolean;
  updateUser: (userData: Partial<User>) => void;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      fetchCurrentUser();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await api.get('/auth/me');
      const userData = response.data.user;
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      delete api.defaults.headers.common['Authorization'];
    } finally {
      setLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    const { token, user } = response.data;
    
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const hasPermission = (module: string, action: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    
    // Handle both permission formats
    if (Array.isArray(user.permissions)) {
      // Check if it's an array of strings (staff format)
      if (user.permissions.length > 0 && typeof user.permissions[0] === 'string') {
        const permissionString = `${module}:${action}`;
        return (user.permissions as string[]).includes(permissionString);
      }
      // Check if it's an array of objects (admin format)
      else {
        const modulePermission = (user.permissions as Array<{module: string; actions: string[]}>).find(p => p.module === module);
        return modulePermission ? modulePermission.actions.includes(action) : false;
      }
    }
    
    return false;
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  const value = {
    user,
    login,
    logout,
    loading,
    hasPermission,
    updateUser,
    setUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};