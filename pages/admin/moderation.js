/**
 * pages/admin/moderation.js  —  Panel de moderación
 *
 * Tiendas pendientes de aprobación + reportes abiertos.
 * Los botones llaman a /api/tiendas/aprobar y /api/moderacion/reportes,
 * ambos protegidos por permisos en el backend.
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../../components/Header';
import { useAuth, tienePermiso } from '../../lib/useAuth';
import { ROLES, PERMISOS } from '../../lib/rbac/constants';

export default function Moderation() {
  const { usuario, cargando } = useAuth();
  const router = useRouter();
  const [pendientes, setPendientes] = useState([]);
  const [reportes, setReportes] = useState([]);

  const puedeAprobar = usuario && tienePermiso(usuario, PERMISOS.APROBAR_TIENDAS);
  const puedeReportes = usuario && tienePermiso(usuario, PERMISOS.RESOLVER_REPORTES);

  useEffect(() => {
    const permitido = usuario && (usuario.role === ROLES.MODERADOR || usuario.role === ROLES.SUPERADMIN);
    if (!cargando && !permitido) router.replace('/');
  }, [cargando, usuario, router]);

  const cargar = useCallback(async () => {
    if (puedeAprobar) {
      const r = await fetch('/api/tiendas?estado=pendiente');
      if (r.ok) setPendientes(await r.json());
    }
    if (puedeReportes) {
      const r = await fetch('/api/moderacion/reportes');
      if (r.ok) setReportes(await r.json());
    }
  }, [puedeAprobar, puedeReportes]);

  useEffect(() => { if (usuario) cargar(); }, [usuario, cargar]);

  const decidirTienda = async (tiendaId, decision) => {
    await fetch('/api/tiendas/aprobar', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tiendaId, decision }),
    });
    cargar();
  };

  const resolverReporte = async (reporteId, estado) => {
    await fetch('/api/moderacion/reportes', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reporteId, estado }),
    });
    cargar();
  };

  if (cargando || !usuario) return (<><Header /><p style={{ padding: '5rem', textAlign: 'center' }}>Cargando…</p></>);

  return (
    <>
      <Head><title>Moderación · stiimpys.store</title></Head>
      <Header />

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '3rem 2rem' }}>
        <p className="eyebrow">Moderación</p>
        <h1 className="display" style={{ fontSize: '2.4rem', marginBottom: 30 }}>Revisión de la plataforma</h1>

        {puedeAprobar && (
          <section style={{ marginBottom: 40 }}>
            <p className="eyebrow" style={{ marginBottom: 14 }}>Tiendas pendientes ({pendientes.length})</p>
            {pendientes.length === 0 ? <p style={{ color: 'var(--muted)' }}>Nada pendiente.</p> : pendientes.map((t) => (
              <div key={t._id} className="panel" style={fila}>
                <div style={{ flex: 1 }}>
                  <strong>{t.nombre}</strong>
                  <p style={{ fontSize: 12, color: 'var(--muted)' }}>{t.descripcion || 'Sin descripción'}</p>
                </div>
                <button className="btn btn-primary" onClick={() => decidirTienda(t._id, 'aprobar')}>Aprobar</button>
                <button className="btn btn-ghost" onClick={() => decidirTienda(t._id, 'rechazar')}>Rechazar</button>
              </div>
            ))}
          </section>
        )}

        {puedeReportes && (
          <section>
            <p className="eyebrow" style={{ marginBottom: 14 }}>Reportes abiertos ({reportes.length})</p>
            {reportes.length === 0 ? <p style={{ color: 'var(--muted)' }}>Sin reportes.</p> : reportes.map((r) => (
              <div key={r._id} className="panel" style={fila}>
                <div style={{ flex: 1 }}>
                  <strong style={{ textTransform: 'capitalize' }}>{r.tipo} reportado</strong>
                  <p style={{ fontSize: 12, color: 'var(--muted)' }}>{r.motivo || 'Sin motivo especificado'}</p>
                </div>
                <button className="btn btn-primary" onClick={() => resolverReporte(r._id, 'resuelto')}>Resolver</button>
                <button className="btn btn-ghost" onClick={() => resolverReporte(r._id, 'descartado')}>Descartar</button>
              </div>
            ))}
          </section>
        )}
      </div>
    </>
  );
}

const fila = { display: 'flex', alignItems: 'center', gap: 12, padding: '1rem 1.4rem', marginBottom: 10 };
