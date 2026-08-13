/**
 * pages/index.js  —  Landing principal (stiimpys.store)
 *
 * Secciones pedidas: Hero, Quiénes somos / Qué hacemos,
 * Tiendas destacadas (grid), Carrusel de reseñas con scroll.
 * Preserva la estética original: hero navy→azul con palabra
 * gigante de fondo en Bebas Neue.
 */

import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/Header';
import { getDb } from '../lib/db/_db';

export default function Home({ tiendas, resenas }) {
  return (
    <>
      <Head>
        <title>stiimpys.store · Marketplace de tiendas vintage & streetwear</title>
        <meta name="description" content="El marketplace que conecta tiendas independientes de ropa vintage y streetwear. Dale una segunda vida a la ropa." />
        <meta name="theme-color" content="#2d6be4" />
      </Head>

      <Header />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section style={heroStyle}>
        <span style={heroGhost}>STIIMPYS</span>
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p className="eyebrow" style={{ color: 'rgba(247,244,239,.6)', marginBottom: 18 }}>
            Marketplace de tiendas independientes
          </p>
          <h1 className="display" style={heroTitle}>
            Ropa con <em style={{ color: '#7eb8f5', fontStyle: 'italic' }}>segunda</em><br />vida
          </h1>
          <p style={heroSub}>
            Vintage · Streetwear · Bazares curados en un solo lugar
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 34, flexWrap: 'wrap' }}>
            <Link href="/catalogo" className="btn btn-primary">Explorar prendas</Link>
            <Link href="/#tiendas" className="btn btn-ghost" style={{ color: '#f7f4ef', borderColor: 'rgba(247,244,239,.3)' }}>
              Ver tiendas
            </Link>
          </div>
        </div>
      </section>

      {/* ── QUIÉNES SOMOS ────────────────────────────────────── */}
      <section style={{ maxWidth: 900, margin: '0 auto', padding: '5rem 2rem', textAlign: 'center' }}>
        <p className="eyebrow" style={{ marginBottom: 16 }}>Qué hacemos</p>
        <h2 className="display" style={{ fontSize: 'clamp(2rem,5vw,3.4rem)', lineHeight: 1, marginBottom: 20 }}>
          Conectamos tiendas, no solo prendas
        </h2>
        <p style={{ fontSize: 16, color: 'var(--text2)', lineHeight: 1.7, maxWidth: 640, margin: '0 auto' }}>
          stiimpys.store reúne tiendas independientes de ropa vintage y streetwear en una sola
          plataforma. Cada tienda tiene su propio catálogo, su identidad y sus reglas — nosotros
          damos la vitrina, la confianza y las herramientas para que vender ropa de segunda mano
          sea tan cuidado como comprar de primera.
        </p>
      </section>

      {/* ── TIENDAS DESTACADAS ───────────────────────────────── */}
      <section id="tiendas" style={{ padding: '2rem 2rem 5rem', maxWidth: 1400, margin: '0 auto' }}>
        <p className="eyebrow" style={{ marginBottom: 6, textAlign: 'center' }}>Colaboradores</p>
        <h2 className="display" style={{ fontSize: 'clamp(1.8rem,4vw,2.8rem)', textAlign: 'center', marginBottom: 40 }}>
          Tiendas en la plataforma
        </h2>

        {tiendas.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--muted)' }}>Aún no hay tiendas aprobadas.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 24 }}>
            {tiendas.map((t) => (
              <Link key={t._id} href={`/tienda/${t.slug}`} className="panel" style={tiendaCard}>
                <div style={tiendaBanner(t.bannerUrl)} />
                <div style={{ padding: '1.2rem 1.4rem' }}>
                  <strong style={{ fontSize: 16, textTransform: 'uppercase', letterSpacing: '.03em' }}>{t.nombre}</strong>
                  <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>
                    {t.ubicacion || 'México'} · ★ {t.calificacionPromedio?.toFixed(1) || '—'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── CARRUSEL DE RESEÑAS ──────────────────────────────── */}
      {resenas.length > 0 && (
        <section style={{ background: 'var(--hero-gradient)', padding: '3.5rem 0', overflow: 'hidden' }}>
          <p className="eyebrow" style={{ color: 'rgba(247,244,239,.6)', textAlign: 'center', marginBottom: 28 }}>
            La comunidad opina
          </p>
          <div style={marqueeTrack}>
            {[...resenas, ...resenas].map((r, i) => (
              <div key={i} style={resenaCard}>
                <div style={{ color: '#7eb8f5', fontSize: 15, marginBottom: 8 }}>
                  {'★'.repeat(r.calificacion)}{'☆'.repeat(5 - r.calificacion)}
                </div>
                <p style={{ fontSize: 14, lineHeight: 1.6 }}>{r.comentario}</p>
              </div>
            ))}
          </div>
          <style>{`
            @keyframes scrollX { from { transform: translateX(0); } to { transform: translateX(-50%); } }
          `}</style>
        </section>
      )}

      <footer style={{ textAlign: 'center', padding: '2.5rem', fontSize: 11, color: 'var(--muted)', letterSpacing: '.1em', textTransform: 'uppercase' }}>
        stiimpys.store · Reynosa, Tamaulipas
      </footer>
    </>
  );
}

/* ── Server-side: trae tiendas aprobadas y reseñas visibles ── */
export async function getServerSideProps() {
  try {
    const db = await getDb();
    const [tiendas, resenas] = await Promise.all([
      db.collection('tiendas').find({ estado: 'aprobada' }).limit(8).toArray(),
      db.collection('resenas').find({ estado: 'visible', comentario: { $ne: null } }).sort({ createdAt: -1 }).limit(10).toArray(),
    ]);
    return {
      props: {
        tiendas: JSON.parse(JSON.stringify(tiendas)),
        resenas: JSON.parse(JSON.stringify(resenas)),
      },
    };
  } catch {
    // Si la DB no está lista todavía, la landing igual renderiza vacía
    return { props: { tiendas: [], resenas: [] } };
  }
}

/* ── estilos inline de esta página ──────────────────────────── */
const heroStyle = {
  background: 'var(--hero-gradient)', padding: '6rem 2.5rem', textAlign: 'center',
  position: 'relative', overflow: 'hidden',
};
const heroGhost = {
  position: 'absolute', fontFamily: "'Bebas Neue',sans-serif", fontSize: '18vw',
  color: 'rgba(255,255,255,.04)', top: '50%', left: '50%',
  transform: 'translate(-50%,-50%)', pointerEvents: 'none', whiteSpace: 'nowrap',
};
const heroTitle = { fontSize: 'clamp(3rem,8vw,7rem)', lineHeight: .95, color: '#f7f4ef', marginBottom: 14 };
const heroSub = { fontSize: 11, color: 'rgba(247,244,239,.55)', letterSpacing: '.35em', textTransform: 'uppercase' };
const tiendaCard = { display: 'block', overflow: 'hidden', cursor: 'pointer' };
const tiendaBanner = (url) => ({
  height: 120, background: url ? `url(${url}) center/cover` : 'var(--accent-gradient)',
});
const marqueeTrack = { display: 'flex', gap: 20, width: 'max-content', animation: 'scrollX 40s linear infinite', padding: '0 20px' };
const resenaCard = {
  width: 300, flexShrink: 0, background: 'rgba(255,255,255,.06)',
  border: '1px solid rgba(255,255,255,.12)', borderRadius: 14, padding: '1.4rem', color: '#f7f4ef',
};
