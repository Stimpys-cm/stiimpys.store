/**
 * pages/perfil/[username].js  —  Perfil de USUARIO (comprador)
 *
 * Esta es la cuenta de la persona como comprador — distinta de su
 * tienda (/tienda/[slug]). Tabs: Purchases, Favorites, Following,
 * Reviews, Ajustes. Si además es dueño de una tienda, aparece un
 * botón para ir a gestionarla.
 */

import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Header from '../../components/Header';
import ProductCard from '../../components/ProductCard';
import { useAuth } from '../../lib/useAuth';
import { getDb } from '../../lib/db/_db';

const TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36'];

function fecha(f) {
  return f ? new Date(f).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
}

export default function PerfilUsuario({ perfil, tiendaPropia }) {
  const { usuario, refrescar } = useAuth();
  const esMiPerfil = usuario?.username === perfil?.username;

  const TABS = esMiPerfil
    ? ['Purchases', 'Favorites', 'Following', 'Reviews', 'Ajustes']
    : ['Following', 'Reviews'];
  const [tab, setTab] = useState(TABS[0]);

  const [compras, setCompras] = useState([]);
  const [favoritos, setFavoritos] = useState([]);
  const [siguiendo, setSiguiendo] = useState([]);
  const [cargando, setCargando] = useState(false);

  // Ajustes
  const [tallas, setTallas] = useState(perfil?.misTallas || []);
  const [bio, setBio] = useState(perfil?.bio || '');
  const [ubicacion, setUbicacion] = useState(perfil?.ubicacion || '');
  const [msg, setMsg] = useState('');

  const cargarTab = useCallback(async (t) => {
    setCargando(true);
    try {
      if (t === 'Purchases' && esMiPerfil) {
        const r = await fetch('/api/compras');
        if (r.ok) setCompras(await r.json());
      } else if (t === 'Favorites' && esMiPerfil) {
        const r = await fetch('/api/favoritos');
        if (r.ok) setFavoritos(await r.json());
      } else if (t === 'Following') {
        const url = esMiPerfil ? '/api/usuarios/siguiendo' : `/api/usuarios/siguiendo?usuarioId=${perfil._id}`;
        const r = await fetch(url);
        if (r.ok) setSiguiendo(await r.json());
      }
    } finally {
      setCargando(false);
    }
  }, [esMiPerfil, perfil]);

  useEffect(() => { cargarTab(tab); }, [tab, cargarTab]);

  if (!perfil) return (<><Header /><p style={{ textAlign: 'center', padding: '5rem' }}>Usuario no encontrado.</p></>);

  const toggleTalla = (t) => setTallas((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t]);

  const guardarPerfil = async () => {
    setMsg('');
    const res = await fetch(`/api/usuarios/${usuario._id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ misTallas: tallas, bio, ubicacion }),
    });
    if (res.ok) { setMsg('Guardado ✓'); await refrescar(); }
    else setMsg('No se pudo guardar');
  };

  return (
    <>
      <Head><title>{perfil.username} · stiimpys.store</title></Head>
      <Header />

      <div style={{ height: 160, background: perfil.bannerUrl ? `url(${perfil.bannerUrl}) center/cover` : 'var(--hero-gradient)' }} />

      <div style={{ maxWidth: 900, margin: '-45px auto 0', padding: '0 2rem', display: 'flex', gap: 22, alignItems: 'flex-start', position: 'relative', zIndex: 2 }}>
        <div style={{ width: 96, height: 96, borderRadius: '50%', border: '4px solid var(--white)', background: perfil.avatarUrl ? `url(${perfil.avatarUrl}) center/cover` : 'var(--accent-gradient)', flexShrink: 0 }} />
        <div style={{ flex: 1, paddingTop: 50 }}>
          <h1 className="display" style={{ fontSize: '2.2rem', lineHeight: 1 }}>{perfil.username}</h1>
          <p style={{ color: 'var(--muted)', fontSize: 13, marginTop: 6 }}>
            {perfil.ubicacion || 'México'} · {perfil.seguidores?.length || 0} seguidores · {perfil.siguiendo?.length || 0} siguiendo
          </p>
          {perfil.bio && <p style={{ marginTop: 12, fontSize: 14, color: 'var(--text2)' }}>{perfil.bio}</p>}
        </div>

        {/* Si esta persona tiene tienda propia, acceso rápido a gestionarla */}
        {esMiPerfil && tiendaPropia && (
          <Link href={`/tienda/${tiendaPropia.slug}`} className="btn btn-ghost" style={{ marginTop: 50 }}>
            Ver mi tienda
          </Link>
        )}
      </div>

      <div style={{ maxWidth: 900, margin: '2rem auto 0', padding: '0 2rem', display: 'flex', gap: 4, borderBottom: '1.5px solid var(--border)', flexWrap: 'wrap' }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ background: 'none', border: 'none', padding: '12px 18px', fontSize: 12, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`, color: tab === t ? 'var(--accent)' : 'var(--text-dark)', cursor: 'pointer' }}>
            {t}
          </button>
        ))}
      </div>

      {/* ── PURCHASES ── */}
      {tab === 'Purchases' && (
        cargando ? <p style={vacio}>Cargando…</p>
        : compras.length === 0 ? <p style={vacio}>Todavía no has comprado nada.</p>
        : <div style={{ maxWidth: 720, margin: '2rem auto', padding: '0 2rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {compras.map((c) => (
              <div key={c._id} className="panel" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '1rem 1.2rem' }}>
                <div style={{ width: 56, height: 72, borderRadius: 8, overflow: 'hidden', background: 'var(--gray)', flexShrink: 0 }}>
                  {c.fotoPrenda && <img src={c.fotoPrenda} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: 14 }}>{c.tituloPrenda || 'Prenda'}</strong>
                  <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 3 }}>
                    {c.tienda?.nombre && <>de <Link href={`/tienda/${c.tienda.slug}`} style={{ color: 'var(--accent)' }}>{c.tienda.nombre}</Link> · </>}
                    {fecha(c.createdAt)}
                  </p>
                </div>
                <span className="card-price" style={{ fontSize: '1.5rem' }}>${Number(c.precio).toLocaleString('es-MX')}</span>
              </div>
            ))}
          </div>
      )}

      {/* ── FAVORITES ── */}
      {tab === 'Favorites' && (
        cargando ? <p style={vacio}>Cargando…</p>
        : favoritos.length === 0 ? <p style={vacio}>No tienes prendas favoritas.</p>
        : <div className="grid">{favoritos.map((f) => <ProductCard key={f.prenda._id} prenda={f.prenda} favoritoInicial />)}</div>
      )}

      {/* ── FOLLOWING ── */}
      {tab === 'Following' && (
        cargando ? <p style={vacio}>Cargando…</p>
        : siguiendo.length === 0 ? <p style={vacio}>No sigue a nadie todavía.</p>
        : <div style={{ maxWidth: 720, margin: '2rem auto', padding: '0 2rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {siguiendo.map((u) => (
              <Link key={u._id} href={`/perfil/${u.username}`} className="panel" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '0.9rem 1.2rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: u.avatarUrl ? `url(${u.avatarUrl}) center/cover` : 'var(--accent-gradient)', flexShrink: 0 }} />
                <div>
                  <strong style={{ fontSize: 14 }}>{u.username}</strong>
                  <p style={{ fontSize: 12, color: 'var(--muted)' }}>{u.ubicacion || 'México'}</p>
                </div>
              </Link>
            ))}
          </div>
      )}

      {/* ── REVIEWS ── */}
      {tab === 'Reviews' && <p style={vacio}>Sin reseñas todavía.</p>}

      {/* ── AJUSTES ── */}
      {tab === 'Ajustes' && esMiPerfil && (
        <div style={{ maxWidth: 620, margin: '2rem auto', padding: '0 2rem' }}>
          <div className="panel" style={{ padding: '1.8rem' }}>
            <p className="eyebrow" style={{ marginBottom: 16 }}>Mis tallas · usadas por "Add my sizes"</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {TALLAS.map((t) => (
                <button key={t} onClick={() => toggleTalla(t)} className="cat-chip"
                  style={{ cursor: 'pointer', padding: '6px 14px', background: tallas.includes(t) ? 'var(--accent)' : 'rgba(45,107,228,.08)', color: tallas.includes(t) ? '#fff' : 'var(--accent)' }}>
                  {t}
                </button>
              ))}
            </div>
            <div className="field"><label>Ubicación</label><input value={ubicacion} onChange={(e) => setUbicacion(e.target.value)} /></div>
            <div className="field"><label>Bio</label><textarea rows={3} value={bio} onChange={(e) => setBio(e.target.value)} /></div>
            {msg && <p style={{ fontSize: 13, color: msg.includes('✓') ? 'var(--success)' : 'var(--danger)', marginBottom: 12 }}>{msg}</p>}
            <button className="btn btn-primary" onClick={guardarPerfil}>Guardar cambios</button>
          </div>

          {/* Convertirse en tienda si aún no lo es */}
          {!tiendaPropia && (
            <div className="panel" style={{ padding: '1.8rem', marginTop: 20, textAlign: 'center' }}>
              <p style={{ color: 'var(--text2)', marginBottom: 14 }}>¿Quieres vender en stiimpys.store?</p>
              <Link href="/admin/nueva-tienda" className="btn btn-primary">Solicitar mi tienda</Link>
            </div>
          )}
        </div>
      )}
    </>
  );
}

export async function getServerSideProps({ params }) {
  try {
    const db = await getDb();
    const perfil = await db.collection('usuarios').findOne(
      { username: params.username },
      { projection: { passwordHash: 0, email: 0, permisos: 0 } }
    );
    if (!perfil) return { props: { perfil: null, tiendaPropia: null } };

    // ¿Esta persona tiene una tienda propia?
    const tienda = await db.collection('tiendas').findOne(
      { ownerId: perfil._id },
      { projection: { slug: 1, nombre: 1, estado: 1 } }
    );

    return {
      props: {
        perfil: JSON.parse(JSON.stringify(perfil)),
        tiendaPropia: tienda ? JSON.parse(JSON.stringify(tienda)) : null,
      },
    };
  } catch {
    return { props: { perfil: null, tiendaPropia: null } };
  }
}

const vacio = { padding: '5rem 2rem', textAlign: 'center', fontSize: 12, color: 'var(--muted)', letterSpacing: '.15em', textTransform: 'uppercase' };
