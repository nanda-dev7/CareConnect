import { createContext, useContext, useState, useEffect } from 'react';
import { authApi, providerApi } from '../services/api';

const AuthContext = createContext();

export const DEMO_CREDENTIALS = {
  admin: { email: 'admin@careconnect.com', password: 'Password123!', name: 'Platform Admin', role: 'admin' },
  operations: { email: 'operations@careconnect.com', password: 'Password123!', name: 'Ops Manager', role: 'operations' },
  support: { email: 'support@careconnect.com', password: 'Password123!', name: 'Support Agent', role: 'support' },
  customer: { email: 'customer1@gmail.com', password: 'Password123!', name: 'Arun Verma', role: 'customer' },
  provider: { email: 'provider.plumbing@careconnect.com', password: 'Password123!', name: 'Ravi Kumar (Plumbing)', role: 'provider' }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('careconnect_token') || null);
  const [providerProfile, setProviderProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const response = await authApi.getMe();
        if (response.success && response.data.user) {
          setUser(response.data.user);
          if (response.data.user.role === 'provider') {
            try {
              const provRes = await providerApi.getMe();
              if (provRes.success) setProviderProfile(provRes.data);
            } catch (err) {
              console.warn('Could not fetch provider profile:', err);
            }
          }
        } else {
          logout();
        }
      } catch (error) {
        console.error('Failed to verify token:', error);
        logout();
      } finally {
        setLoading(false);
      }
    }
    loadUser();
  }, [token]);

  const login = async (email, password) => {
    setAuthError(null);
    try {
      const response = await authApi.login({ email, password });
      if (response.success && response.data.token) {
        const tokenVal = response.data.token;
        const userVal = response.data.user;
        localStorage.setItem('careconnect_token', tokenVal);
        setToken(tokenVal);
        setUser(userVal);

        if (userVal.role === 'provider') {
          try {
            const provRes = await providerApi.getMe();
            if (provRes.success) setProviderProfile(provRes.data);
          } catch (err) {
            console.warn(err);
          }
        }
        return userVal;
      }
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  };

  const register = async (userData) => {
    setAuthError(null);
    try {
      const response = await authApi.register(userData);
      if (response.success && response.data.token) {
        const tokenVal = response.data.token;
        const userVal = response.data.user;
        localStorage.setItem('careconnect_token', tokenVal);
        setToken(tokenVal);
        setUser(userVal);
        if (response.data.provider) {
          setProviderProfile(response.data.provider);
        }
        return userVal;
      }
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  };

  const quickDemoLogin = async (roleKey) => {
    const creds = DEMO_CREDENTIALS[roleKey];
    if (creds) {
      return await login(creds.email, creds.password);
    }
  };

  const logout = () => {
    localStorage.removeItem('careconnect_token');
    setToken(null);
    setUser(null);
    setProviderProfile(null);
  };

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const response = await authApi.getMe();
      if (response.success) setUser(response.data.user);
      if (user?.role === 'provider') {
        const provRes = await providerApi.getMe();
        if (provRes.success) setProviderProfile(provRes.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        providerProfile,
        loading,
        authError,
        login,
        register,
        logout,
        quickDemoLogin,
        refreshProfile,
        isAuthenticated: !!user,
        role: user?.role || null
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
