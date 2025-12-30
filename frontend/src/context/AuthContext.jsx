import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client'; 

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Fungsi Helper untuk membersihkan sesi (tanpa panggil API)
  // Gunakan useCallback agar bisa dipakai di dalam useEffect tanpa warning
  const cleanupAuth = useCallback(() => {
    localStorage.removeItem('token');
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
    setIsAuthenticated(false);
    setLoading(false);
  }, []);

  const verifyToken = useCallback(async () => {
    try {
      const response = await api.get('/auth/verify');
      if (response.data.valid) {
        setUser(response.data.user);
        setIsAuthenticated(true);
      } else {
        cleanupAuth();
      }
    } catch (error) {
      console.error('Token verification failed:', error.message);
      cleanupAuth();
    } finally {
      setLoading(false);
    }
  }, [cleanupAuth]);

  // Setup Axios Interceptor & Initial Check
  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      verifyToken();
    } else {
      setLoading(false);
    }

    // Interceptor untuk menangani error global (terutama 401)
    const interceptor = api.interceptors.response.use(
      (response) => response,
      (error) => {
        const originalRequest = error.config;

        // Jika error 401 (Unauthorized)
        if (error.response?.status === 401) {
          // Jika 401 terjadi saat login, jangan logout (biarkan Login.jsx handle errornya)
          if (originalRequest.url.includes('/auth/login')) {
            return Promise.reject(error);
          }

          // Jika 401 terjadi saat logout atau verify, langsung bersihkan lokal
          if (originalRequest.url.includes('/auth/logout') || originalRequest.url.includes('/auth/verify')) {
            cleanupAuth();
          } else {
            // Untuk request lainnya, jalankan logout formal
            logout();
          }
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptor saat component unmount
    return () => {
      api.interceptors.response.eject(interceptor);
    };
  }, [cleanupAuth, verifyToken]);

  const login = async (username, password) => {
    try {
      const response = await api.post('/auth/login', { username, password });
      const { token, user } = response.data;
      
      localStorage.setItem('token', token);
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(user);
      setIsAuthenticated(true);
      
      return { success: true, user };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login gagal. Cek kembali username/password.' 
      };
    }
  };

  const logout = async () => {
    try {
      // Panggil API logout (optional, untuk hapus session di server jika ada)
      await api.post('/auth/logout');
    } catch (error) {
      console.warn('Logout API call failed, but proceeding with local cleanup.');
    } finally {
      cleanupAuth();
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      // Setelah ganti password, biasanya paksa logout untuk login ulang
      await logout();
      return { success: true, message: response.data.message };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Gagal mengubah password' 
      };
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    changePassword,
    api // Instance API dibagikan agar komponen lain bisa pakai interceptor yang sama
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
