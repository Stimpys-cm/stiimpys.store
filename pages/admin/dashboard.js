/**
 * pages/admin/dashboard.js  —  Punto de entrada del panel
 *
 * Muestra accesos según rol: admin de tienda ve sus tiendas;
 * moderador ve moderación; superadmin ve todo (usuarios + moderación).
 * Guard de cliente: si no hay sesión válida, redirige a /login.
 */

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../components/Header';
import { useAuth, tienePermiso } from '../../lib/useAuth';
import { ROLES, PERMISOS } from '../../lib/rbac/constants';

export default function Dashboard() {
  const { usuario, cargando } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!cargando && !usuario) router.replace('/login');
  }, [cargando, usuario, router]);

  if (cargando || !usuario) {
    return (<><Header /><p style={{ padding: '5rem', textAlign: 'center' }}>Verificando acceso…</p></>);
  }

  const esSuper = usuario.role === ROLES.SUPERADMIN;
  const esMod = usuario.role === ROLES.MODERADOR || esSuper;

  return (
    <>
      <Head><title>Panel · stiimpys.store</title></Head>
      <Header />

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '3rem 2rem' }}>
        <p className="eyebrow">Panel de control</p>
        <h1 className="display" style={{ fontSize: '2.6rem', marginBottom: 6 }}>
          Hola, {usuario.username}
        </h1>
        <p style={{ color: 'var(--muted)', marginBottom: 36, textTransform: 'capitalize' }}>
          Rol: {usuario.role.replace('_', ' ')}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 20 }}>
          {/* Tiendas que administra */}
          {usuario.tiendasAdmin?.map((tid) => (
            <Link key={tid} href={`/admin/${tid}`} className="panel" style={tile}>
              <span className="eyebrow">Mi tienda</span>
              <strong style={tileTitle}>Gestionar inventario</strong>
              <span style={tileArrow}>→</span>
            </Link>
          ))}

          {(esMod || tienePermiso(usuario, PERMISOS.RESOLVER_REPORTES)) && (
            <Link href="/admin/moderation" className="panel" style={tile}>
              <span className="eyebrow">Moderación</span>
              <strong style={tileTitle}>Reportes y aprobaciones</strong>
              <span style={tileArrow}>→</span>
            </Link>
          )}

          {esSuper && (
            <Link href="/admin/users" className="panel" style={tile}>
              <span className="eyebrow">Administración</span>
              <strong style={tileTitle}>Usuarios, roles y permisos</strong>
              <span style={tileArrow}>→</span>
            </Link>
          )}
        </div>

        {usuario.role === ROLES.CLIENTE && (
          <div className="panel" style={{ padding: '2rem', marginTop: 24, textAlign: 'center' }}>
            <p style={{ color: 'var(--text2)', marginBottom: 16 }}>
              Todavía no tienes una tienda. ¿Quieres vender en stiimpys.store?
            </p>
            <Link href="/admin/nueva-tienda" className="btn btn-primary">Crear mi tienda</Link>
          </div>
        )}
      </div>
    </>
  );
}

const tile = { padding: '1.6rem', display: 'flex', flexDirection: 'column', gap: 8, position: 'relative', cursor: 'pointer', minHeight: 130 };
const tileTitle = { fontSize: 17, lineHeight: 1.2 };
const tileArrow = { position: 'absolute', bottom: 18, right: 20, color: 'var(--accent)', fontSize: 20 };
