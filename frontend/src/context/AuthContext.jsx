import { createContext, useContext, useState, useEffect } from 'react';
import { useMsal } from '@azure/msal-react';
import { loginRequest, apiRequest } from '../authConfig';
import api from '../services/api';

const AuthContext = createContext(null);
const AUTH_DISABLED = import.meta.env.VITE_AUTH_DISABLED === 'true';

export function AuthProvider({ children }) {
  const { instance, accounts } = useMsal();
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (AUTH_DISABLED) {
      // Sin MSAL: el backend (Auth:Enabled=false) autentica todo request como
      // Auth:DevUserEmail, así que /auth/me se puede llamar sin token.
      cargarUsuarioSinMsal();
    } else if (accounts.length > 0) {
      cargarUsuario();
    } else {
      setCargando(false);
    }
  }, [accounts]);

  const cargarUsuarioSinMsal = async () => {
    try {
      delete api.defaults.headers.common['Authorization'];
      const res = await api.get('/auth/me');
      setUsuario(res.data);
    } catch (e) {
      console.error('Error cargando usuario (modo sin login):', e);
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  };

  const cargarUsuario = async () => {
    try {
      const tokenResponse = await instance.acquireTokenSilent({
        ...apiRequest,
        account: accounts[0],
      });

      api.defaults.headers.common['Authorization'] = `Bearer ${tokenResponse.accessToken}`;
      const res = await api.get('/auth/me');
      setUsuario(res.data);
    } catch (e) {
      console.error('Error cargando usuario:', e);
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  };

  const login  = () => (AUTH_DISABLED ? null : instance.loginRedirect(loginRequest));
  const logout = () => {
    setUsuario(null);
    if (!AUTH_DISABLED) instance.logoutRedirect();
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);