/**
 * pages/tienda/[slug].js  —  Perfil público de una tienda
 *
 * Header de perfil estilo Grailed: avatar/logo circular, nombre,
 * ubicación, transacciones, calificación en estrellas, seguidores,
 * botón +NEW LISTING (solo con permiso). Tabs: Selling, Reviews.
 */

import { useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../components/Header';
import ProductCard from '../../components/ProductCard';
import { useAuth, tienePermiso } from '../../lib/useAuth';
import { getDb } from '../../lib/db/_db';
import { PERMISOS } from '../../lib/rbac/constants';

const TABS = ['Selling', 'Reviews'];

export default function PerfilTienda({ tienda, prendas, resenas }) {
  const { usuario } = useAuth();
  const [tab, setTab] = useState('Selling');

  if (!tienda) {
    return (<><Header /><p style={{ textAlign: 'center', padding: '5rem' }}>Tienda no encontrada.</p></>);
  }

  const puedePublicar =
    usuario &&
    (usuario.tiendasAdmin?.includes(tienda._id) || tienePermiso(usuario, PERMISOS.PUBLICAR_PRENDAS));

  return (
    <>
      <Head><title>{tienda.nombre} · stiimpys.store</title></Head>
      <Header />

      {/* Banner */}
      <div style={{ height: 200, background: tienda.bannerUrl ? `url(${tienda.bannerUrl}) center/cover` : 'var(--hero-gradient)' }} />

      {/* Header de perfil */}
      <div style={perfilHeader}>
        <div style={avatar(tienda.logoUrl)} />
        <div style={{ flex: 1 }}>
          <h1 className="display" style={{ fontSize: '2.6rem', lineHeight: 1 }}>{tienda.nombre}</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>
            {tienda.ubicacion || 'México'} · {tienda.totalVentas || 0} transacciones
          </p>
          <div style={{ display: 'flex', gap: 18, marginTop: 12, fontSize: 13 }}>
            <span style={{ color: '#e0a03c' }}>
              {'★'.repeat(Math.round(tienda.calificacionPromedio || 0))}
              {'☆'.repeat(5 - Math.round(tienda.calificacionPromedio || 0))}
              <span style={{ color: 'var(--muted)', marginLeft: 6 }}>
                {tienda.calificacionPromedio?.toFixed(1) || 'Sin reseñas'}
              </span>
            </span>
          </div>
          {tienda.descripcion && <p style={{ marginTop: 14, fontSize: 14, color: 'var(--text2)', maxWidth: 560 }}>{tienda.descripcion}</p>}
        </div>

        {puedePublicar && (
          <Link href={`/admin/${tienda._id}`} className="btn btn-primary">+ NEW LISTING</Link>
        )}
      </div>

      {/* Tabs */}
      <div style={tabsRow}>
        {TABS.map((t) => (
          <button
            key={t} onClick={() => setTab(t)}
            style={{
              ...tabBtn,
              color: tab === t ? 'var(--accent)' : 'var(--text-dark)',
              borderBottomColor: tab === t ? 'var(--accent)' : 'transparent',
            }}
          >
            {t} {t === 'Selling' && `(${prendas.length})`}
          </button>
        ))}
      </div>

      {tab === 'Selling' && (
        prendas.length === 0
          ? <p style={vacio}>Esta tienda aún no tiene prendas publicadas.</p>
          : <div className="grid">{prendas.map((p) => <ProductCard key={p._id} prenda={p} />)}</div>
      )}

      {tab === 'Reviews' && (
        <div style={{ maxWidth: 720, margin: '2rem auto', padding: '0 2rem' }}>
          {resenas.length === 0 ? <p style={vacio}>Sin reseñas todavía.</p> : resenas.map((r) => (
            <div key={r._id} className="panel" style={{ padding: '1.2rem 1.4rem', marginBottom: 14 }}>
              <div style={{ color: '#e0a03c', marginBottom: 6 }}>{'★'.repeat(r.calificacion)}{'☆'.repeat(5 - r.calificacion)}</div>
              <p style={{ fontSize: 14, color: 'var(--text2)' }}>{r.comentario}</p>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

export async function getServerSideProps({ params }) {
  try {
    const db = await getDb();
    const tienda = await db.collection('tiendas').findOne({ slug: params.slug, estado: 'aprobada' });
    if (!tienda) return { props: { tienda: null, prendas: [], resenas: [] } };

    const [prendas, resenas] = await Promise.all([
      db.collection('prendas').find({ tiendaId: tienda._id, estado: 'disponible' }, { projection: { costoInterno: 0 } }).sort({ createdAt: -1 }).toArray(),
      db.collection('resenas').find({ tiendaId: tienda._id, estado: 'visible' }).sort({ createdAt: -1 }).toArray(),
    ]);

    return {
      props: {
        tienda: JSON.parse(JSON.stringify(tienda)),
        prendas: JSON.parse(JSON.stringify(prendas)),
        resenas: JSON.parse(JSON.stringify(resenas)),
      },
    };
  } catch {
    return { props: { tienda: null, prendas: [], resenas: [] } };
  }
}

const perfilHeader = { maxWidth: 1100, margin: '0 auto', padding: '0 2rem', display: 'flex', gap: 24, alignItems: 'flex-start', marginTop: -50, position: 'relative', zIndex: 2 };
const avatar = (url) => ({ width: 110, height: 110, borderRadius: '50%', border: '4px solid var(--white)', background: url ? `url(${url}) center/cover` : 'var(--accent-gradient)', flexShrink: 0, boxShadow: '0 4px 18px rgba(45,107,228,.2)' });
const tabsRow = { maxWidth: 1100, margin: '2.5rem auto 0', padding: '0 2rem', display: 'flex', gap: 6, borderBottom: '1.5px solid var(--border)' };
const tabBtn = { background: 'none', border: 'none', padding: '12px 20px', fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', borderBottom: '2px solid transparent', transition: 'color .2s' };
const vacio = { padding: '5rem 2rem', textAlign: 'center', fontSize: 12, color: 'var(--muted)', letterSpacing: '.15em', textTransform: 'uppercase' };
