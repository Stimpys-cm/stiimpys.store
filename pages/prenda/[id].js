/**
 * pages/prenda/[id].js  —  Detalle de una prenda
 * Galería + datos + botón de contacto por WhatsApp (como el original).
 */

import Head from 'next/head';
import Link from 'next/link';
import Header from '../../components/Header';
import { getDb } from '../../lib/db/_db';
import { ObjectId } from 'mongodb';

export default function DetallePrenda({ prenda, tienda }) {
  if (!prenda) return (<><Header /><p style={{ padding: '5rem', textAlign: 'center' }}>Prenda no encontrada.</p></>);

  const waLink = tienda?.whatsapp
    ? `https://wa.me/${tienda.whatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola! Me interesa "${prenda.titulo}" ($${prenda.precio})`)}`
    : null;

  return (
    <>
      <Head><title>{prenda.titulo} · stiimpys.store</title></Head>
      <Header />

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '2.5rem 2rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
        <div style={{ borderRadius: 16, overflow: 'hidden', aspectRatio: '3/4', background: 'linear-gradient(145deg,#edf2fb,#e8e2d8)' }}>
          {prenda.fotos?.[0]
            ? <img src={prenda.fotos[0]} alt={prenda.titulo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div className="no-photo" style={{ height: '100%' }}>Sin foto</div>}
        </div>

        <div>
          {tienda && (
            <Link href={`/tienda/${tienda.slug}`} className="eyebrow" style={{ display: 'inline-block', marginBottom: 12 }}>
              {tienda.nombre} →
            </Link>
          )}
          <h1 className="display" style={{ fontSize: '2.8rem', lineHeight: 1, marginBottom: 8 }}>{prenda.titulo}</h1>
          {prenda.marca && <p style={{ color: 'var(--muted)', marginBottom: 20 }}>{prenda.marca}</p>}

          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '3rem', color: 'var(--accent)', marginBottom: 24 }}>
            ${Number(prenda.precio).toLocaleString('es-MX')}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
            {prenda.talla && <span className="cat-chip">Talla {prenda.talla}</span>}
            {prenda.categoria && <span className="cat-chip">{prenda.categoria}</span>}
            {prenda.color && <span className="cat-chip">{prenda.color}</span>}
            <span className={`estado-chip estado-${prenda.estado}`}>{prenda.estado}</span>
          </div>

          {prenda.descripcion && <p style={{ lineHeight: 1.7, color: 'var(--text2)', marginBottom: 28 }}>{prenda.descripcion}</p>}

          {waLink && prenda.estado === 'disponible' && (
            <a href={waLink} target="_blank" rel="noreferrer" className="btn" style={{ background: 'var(--whatsapp)', color: '#fff', width: '100%', padding: 15 }}>
              Contactar por WhatsApp
            </a>
          )}
        </div>
      </div>
    </>
  );
}

export async function getServerSideProps({ params }) {
  try {
    const db = await getDb();
    const prenda = await db.collection('prendas').findOne(
      { _id: new ObjectId(params.id) },
      { projection: { costoInterno: 0 } }
    );
    if (!prenda) return { props: { prenda: null, tienda: null } };
    const tienda = await db.collection('tiendas').findOne({ _id: prenda.tiendaId });
    return {
      props: {
        prenda: JSON.parse(JSON.stringify(prenda)),
        tienda: tienda ? JSON.parse(JSON.stringify(tienda)) : null,
      },
    };
  } catch {
    return { props: { prenda: null, tienda: null } };
  }
}
