/**
 * pages/admin/users.js  —  Gestión global (solo SuperAdmin)
 *
 * Tabla de usuarios con selector de rol y toggles de permisos
 * granulares. Cada toggle llama a /api/usuarios/permisos, cada
 * cambio de rol a /api/usuarios/roles. El backend rechaza a
 * cualquiera que no sea superadmin, aunque llegue a esta página.
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../../components/Header';
import { useAuth } from '../../lib/useAuth';
import { ROLES, PERMISOS } from '../../lib/rbac/constants';

// Etiquetas legibles para cada permiso
const ETIQUETAS = {
  [PERMISOS.MODERAR_PUBLICACIONES]: 'Moderar publicaciones',
  [PERMISOS.APROBAR_TIENDAS]: 'Aprobar tiendas',
  [PERMISOS.BANEAR_USUARIOS]: 'Banear usuarios',
  [PERMISOS.MODERAR_RESENAS]: 'Moderar reseñas',
  [PERMISOS.RESOLVER_REPORTES]: 'Resolver reportes',
  [PERMISOS.PUBLICAR_PRENDAS]: 'Publicar prendas',
  [PERMISOS.EDITAR_PRENDAS]: 'Editar prendas',
  [PERMISOS.ELIMINAR_PRENDAS]: 'Eliminar prendas',
  [PERMISOS.EDITAR_CATALOGO]: 'Editar catálogo',
  [PERMISOS.VER_COSTO_INTERNO]: 'Ver costo interno',
  [PERMISOS.VER_GANANCIAS]: 'Ver ganancias',
};

export default function AdminUsers() {
  const { usuario, cargando } = useAuth();
  const router = useRouter();
  const [usuarios, setUsuarios] = useState([]);
  const [expandido, setExpandido] = useState(null);

  useEffect(() => {
    if (!cargando && (!usuario || usuario.role !== ROLES.SUPERADMIN)) router.replace('/');
  }, [cargando, usuario, router]);

  const cargar = useCallback(async () => {
    const res = await fetch('/api/usuarios');
    if (res.ok) setUsuarios(await res.json());
  }, []);

  useEffect(() => { if (usuario?.role === ROLES.SUPERADMIN) cargar(); }, [usuario, cargar]);

  const cambiarRol = async (usuarioId, nuevoRol) => {
    await fetch('/api/usuarios/roles', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuarioId, nuevoRol }),
    });
    cargar();
  };

  const togglePermiso = async (usuarioId, permiso, valor) => {
    await fetch('/api/usuarios/permisos', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuarioId, permiso, valor }),
    });
    cargar();
  };

  if (cargando || usuario?.role !== ROLES.SUPERADMIN) {
    return (<><Header /><p style={{ padding: '5rem', textAlign: 'center' }}>Acceso restringido…</p></>);
  }

  return (
    <>
      <Head><title>Usuarios y permisos · stiimpys.store</title></Head>
      <Header />

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '3rem 2rem' }}>
        <p className="eyebrow">Administración global</p>
        <h1 className="display" style={{ fontSize: '2.4rem', marginBottom: 30 }}>Usuarios, roles y permisos</h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {usuarios.map((u) => (
            <div key={u._id} className="panel" style={{ padding: '1.2rem 1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: 15 }}>{u.username}</strong>
                  <span style={{ fontSize: 12, color: 'var(--muted)', marginLeft: 10 }}>{u.email}</span>
                </div>

                <select
                  value={u.role}
                  onChange={(e) => cambiarRol(u._id, e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: 20, border: '1.5px solid var(--border)', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}
                >
                  {Object.values(ROLES).map((r) => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                </select>

                {u.role !== ROLES.CLIENTE && u.role !== ROLES.SUPERADMIN && (
                  <button className="btn btn-ghost" onClick={() => setExpandido(expandido === u._id ? null : u._id)}>
                    {expandido === u._id ? 'Ocultar' : 'Permisos'}
                  </button>
                )}
              </div>

              {/* Toggles de permisos granulares */}
              {expandido === u._id && (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 10 }}>
                  {Object.entries(ETIQUETAS).map(([permiso, etiqueta]) => (
                    <label key={permiso} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={u.permisos?.[permiso] === true}
                        onChange={(e) => togglePermiso(u._id, permiso, e.target.checked)}
                      />
                      {etiqueta}
                    </label>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
