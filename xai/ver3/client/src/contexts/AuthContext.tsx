import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: number;
  username: string;
  email: string;
  tokens: number;
  walletAddress?: string;
  referrerId?: number;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, referrerCode?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
  updateTokens: (newBalance: number) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on app load
    const token = localStorage.getItem('token');
    if (token) {
      // Validate token and get user data
      fetchUserData(token);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserData = async (token: string) => {
    try {
      console.log('[AUTH] Fetching user data with stored token');
      const response = await fetch('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const userData = await response.json();
        console.log('[AUTH] User data fetched successfully:', userData);
        setUser(userData);
      } else {
        console.log('[AUTH] Token invalid, removing from storage');
        // Token invalid, remove it
        localStorage.removeItem('token');
      }
    } catch (error) {
      console.error('[AUTH] Error fetching user data:', error);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    console.log(`[AUTH] Attempting login for email: ${email}`);
    setLoading(true);
    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.log(`[AUTH] Login failed: ${error.message}`);
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json();
      console.log(`[AUTH] Login successful for user: ${data.user.username}`);
      localStorage.setItem('token', data.token);
      setUser(data.user);
    } catch (error) {
      console.error('[AUTH] Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string, referrerCode?: string) => {
    console.log(`[AUTH] Attempting registration for username: ${username}, email: ${email}`);
    setLoading(true);
    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, email, password, referrerCode }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.log(`[AUTH] Registration failed: ${error.message}`);
        throw new Error(error.message || 'Registration failed');
      }

      const data = await response.json();
      console.log(`[AUTH] Registration successful for user: ${data.user.username}`);
      // Auto-login after registration
      if (data.user) {
        // For now, user needs to login manually after registration
        // In production, you might want to return a token
      }
    } catch (error) {
      console.error('[AUTH] Registration error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log('[AUTH] User logged out');
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateTokens = (newBalance: number) => {
    if (user) {
      setUser({ ...user, tokens: newBalance });
    }
  };

  const value: AuthContextType = {
    user,
    login,
    register,
    logout,
    loading,
    updateTokens,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
