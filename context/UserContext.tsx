'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Define the shape of the user data
export interface UserData {
  _id?: string;
  username?: string;
  email_address?: string;
  role?: string;
  first_name?: string;
  middle_name?: string;
  last_name?: string;
  education_board?: string;
  country_of_residence?: string;
  question_tracking?: {
    [questionId: string]: {
      status: 'success' | 'failed' | 'unsure';
      timestamp: number;
      attempts: number;
      isPdfQuestionSet?: boolean;
    }
  };
  type?: 'student' | 'teacher';
  room?: string;
}

interface UserContextType {
  user: UserData | null;
  loading: boolean;
  error: string | null;
  setUser: (user: UserData | null) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

// Create the context with default values
const UserContext = createContext<UserContextType>({
  user: null,
  loading: true,
  error: null,
  setUser: () => {},
  logout: async () => {},
  refreshUser: async () => {},
});

// Custom hook to use the user context
export const useUser = () => useContext(UserContext);

// Provider component that wraps the app
export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Function to fetch the user data
  const refreshUser = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/auth/me');
      
      if (!response.ok) {
        // If 401 or other auth error, clear user data but don't set error
        if (response.status === 401) {
          setUser(null);
          return;
        }
        throw new Error('Failed to fetch user data');
      }
      
      const userData = await response.json();
      setUser(userData.user || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Error fetching user data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error('Failed to logout');
      }
      
      setUser(null);
      window.location.href = '/auth/login';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to logout');
      console.error('Logout error:', err);
    }
  };

  // Fetch user data on initial load
  useEffect(() => {
    refreshUser();
  }, []);

  const value = {
    user,
    loading,
    error,
    setUser,
    logout,
    refreshUser,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}