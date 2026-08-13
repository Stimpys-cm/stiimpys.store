/**
 * components/Header.jsx
 * Header global. Muestra enlaces según el rol del usuario logueado.
 */

import Link from 'next/link';
import { useAuth } from '../lib/useAuth';
import { ROLES } from '../lib/rbac/constants';

export default function Header() {
  const { usuario, logout } = useAuth();

  const esAdmin =
    usuario &&
    [ROLES.ADMIN_TIENDA, ROLES.MODERADOR, ROLES.SUPERADMIN].includes(usuario.role);

  return (
    <header className="app-header">
      <Link href="/" className="logo">
        STIIMPYS<span>.STORE</span>
      </Link>

      <nav className="header-nav">
        <Link href="/catalogo">Explorar</Link>
        <Link href="/#tiendas">Tiendas</Link>

        {esAdmin && <Link href="/admin/dashboard">Panel</Link>}

        {usuario ? (
          <>
            <Link href={`/perfil/${usuario.username}`}>
              {usuario.username}
            </Link>
            <button className="btn btn-ghost" onClick={logout}>Salir</button>
          </>
        ) : (
          <Link href="/login" className="btn btn-primary">Ingresar</Link>
        )}
      </nav>
    </header>
  );
}
