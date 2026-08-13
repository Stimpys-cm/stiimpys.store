/**
 * pages/perfil/[username].js  —  Perfil de usuario estilo Grailed
 *
 * Header con avatar, seguidores/seguidos y tabs. El tab Favorites
 * carga datos reales de /api/favoritos cuando es el propio usuario.
 * Si es tu perfil, aparece un editor para guardar tus tallas
 * (las que usa "ADD MY SIZES") y datos básicos.
 */

import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Header from '../../components/Header';
import ProductCard from '../../components/ProductCard';
import { useAuth } from '../../lib/useAuth';
import { getDb } from '../../lib/db/_db';

const TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36'];

export default function PerfilUsuario({ perfil }) {
  const { usuario, refrescar } = useAuth();
  const esMiPerfil = usuario?.username === perfil?.username;
  const TABS = esMiPerfil ? ['Favorites', 'Reviews', 'Ajustes'] : ['Reviews'];
  const [tab, setTab] = useState(esMiPerfil ? 'Favorites' : 'Reviews');

  const [favoritos, setFavoritos] = useState([]);
  const [cargandoFav, setCargandoFav] = useState(false);

  const [tallas, setTallas] = useState(perfil?.misTallas || []);
  const [bio, setBio] = useState(perfil?.bio || '');
  const [ubicacion, setUbicacion] = useState(perfil?.ubicacion || '');
  const [msg, setMsg] = useState('');

  const cargarFavoritos = useCallback(async () => {
    if (!esMiPerfil) return;
    setCargandoFav(true);
    try {
      const res = await fetch('/api/favoritos');
      if (res.ok) setFavoritos(await res.json());
    } finally {
      setCargandoFav(false);
    }
  }, [esMiPerfil]);

  useEffect(() => {
    if (tab === 'Favorites') cargarFavoritos();
  }, [tab, cargarFavoritos]);

  if (!perfil) return (<><Header /><p style={{ textAlign: 'center', padding: '5rem' }}>Usuario no encontrado.</p></>);

  const toggleTalla = (t) => {
    setTallas((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  };

  const guardarPerfil = async () => {
    setMsg('');
    const res = await fetch(`/api/usuarios/${usuario._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ misTallas: tallas, bio, ubicacion }),
    });
    if (res.ok) {
      setMsg('Guardado ✓');
      await refrescar();
    } else {
      setMsg('No se pudo guardar');
    }
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
      </div>

      <div style={{ maxWidth: 900, margin: '2rem auto 0', padding: '0 2rem', display: 'flex', gap: 6, borderBottom: '1.5px solid var(--border)' }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ background: 'none', border: 'none', padding: '12px 20px', fontSize: 12, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase', borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`, color: tab === t ? 'var(--accent)' : 'var(--text-dark)', cursor: 'pointer' }}>
            {t}
          </button>
        ))}
      </div>

      {tab === 'Favorites' && (
        cargandoFav ? <p style={vacio}>Cargando…</p>
        : favoritos.length === 0 ? <p style={vacio}>Todavía no tienes prendas favoritas.</p>
        : <div className="grid">{favoritos.map((f) => <ProductCard key={f.prenda._id} prenda={f.prenda} favoritoInicial />)}</div>
      )}

      {tab === 'Reviews' && <p style={vacio}>Sin reseñas todavía.</p>}

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
    return { props: { perfil: perfil ? JSON.parse(JSON.stringify(perfil)) : null } };
  } catch {
    return { props: { perfil: null } };
  }
}

const vacio = { padding: '5rem 2rem', textAlign: 'center', fontSize: 12, color: 'var(--muted)', letterSpacing: '.15em', textTransform: 'uppercase' };
