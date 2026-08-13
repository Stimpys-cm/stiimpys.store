/**
 * lib/useAuth.js
 *
 * Contexto de sesión del lado del cliente. Guarda el usuario actual
 * (rol + permisos) para que los componentes puedan mostrar/ocultar
 * acciones. IMPORTANTE: esto es solo UX — la seguridad real vive en
 * lib/rbac/guards.js del backend. Ocultar un botón nunca reemplaza
 * validar el permiso en el endpoint.
 */

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  const refrescar = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) setUsuario(await res.json());
      else setUsuario(null);
    } catch {
      setUsuario(null);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { refrescar(); }, [refrescar]);

  const login = async (username, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Error al iniciar sesión');
    await refrescar();
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout, refrescar }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}

/**
 * Helper de permisos para el cliente. Refleja la misma lógica de
 * guards.js: superadmin pasa siempre; si no, revisa el flag.
 */
export function tienePermiso(usuario, permiso) {
  if (!usuario) return false;
  if (usuario.role === 'superadmin') return true;
  return usuario.permisos?.[permiso] === true;
}
