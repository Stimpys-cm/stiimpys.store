/**
 * components/ProductCard.jsx
 * Tarjeta de prenda — misma estética que el catálogo original:
 * foto 3/4, brand-tag, nombre, chips de categoría, talla, precio
 * en Bebas Neue y botón de favorito (corazón).
 */

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../lib/useAuth';

function tiempoRelativo(fecha) {
  if (!fecha) return '';
  const dias = Math.floor((Date.now() - new Date(fecha)) / 86400000);
  if (dias <= 0) return 'hoy';
  if (dias === 1) return 'hace 1 día';
  if (dias < 30) return `hace ${dias} días`;
  const meses = Math.floor(dias / 30);
  return `hace ${meses} mes${meses > 1 ? 'es' : ''}`;
}

export default function ProductCard({ prenda, favoritoInicial = false }) {
  const { usuario } = useAuth();
  const [fav, setFav] = useState(favoritoInicial);
  const [guardando, setGuardando] = useState(false);

  const toggleFav = async (e) => {
    e.preventDefault();
    if (!usuario || guardando) return;
    setGuardando(true);
    const metodo = fav ? 'DELETE' : 'POST';
    try {
      await fetch('/api/favoritos', {
        method: metodo,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prendaId: prenda._id }),
      });
      setFav(!fav);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Link href={`/prenda/${prenda._id}`} className="card">
      <div className="card-img">
        {prenda.marca && <span className="brand-tag">{prenda.marca}</span>}
        {usuario && (
          <button
            className={`fav-btn ${fav ? 'active' : ''}`}
            onClick={toggleFav}
            aria-label={fav ? 'Quitar de favoritos' : 'Agregar a favoritos'}
          >
            {fav ? '♥' : '♡'}
          </button>
        )}
        {prenda.fotos?.[0] ? (
          <img src={prenda.fotos[0]} alt={prenda.titulo} loading="lazy" />
        ) : (
          <div className="no-photo">Sin foto</div>
        )}
      </div>

      <div className="card-body">
        <div className="card-name">{prenda.titulo}</div>
        <div className="card-chips">
          {prenda.categoria && <span className="cat-chip">{prenda.categoria}</span>}
          {prenda.talla && <span className="cat-chip">Talla {prenda.talla}</span>}
        </div>
        <div className="card-sub">{tiempoRelativo(prenda.createdAt)}</div>
        <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <span className="card-price">${Number(prenda.precio).toLocaleString('es-MX')}</span>
        </div>
      </div>
    </Link>
  );
}
