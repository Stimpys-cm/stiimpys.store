/**
 * pages/catalogo.js  —  Explorar todas las prendas
 * Sidebar de filtros (Grailed) + grid. Los filtros disparan
 * refetch a /api/prendas con query params.
 */

import { useState, useEffect, useCallback } from 'react';
import Head from 'next/head';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import FilterSidebar from '../components/FilterSidebar';

export default function Catalogo() {
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async (filtros = {}) => {
    setCargando(true);
    const qs = new URLSearchParams(filtros).toString();
    try {
      const res = await fetch(`/api/prendas?${qs}`);
      const data = await res.json();
      setItems(data.items || []);
      setTotal(data.total || 0);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // Deriva las marcas/categorías/colores presentes para poblar filtros
  const marcas = [...new Set(items.map((i) => i.marca).filter(Boolean))].slice(0, 12);
  const categorias = [...new Set(items.map((i) => i.categoria).filter(Boolean))].slice(0, 12);
  const colores = [...new Set(items.map((i) => i.color).filter(Boolean))].slice(0, 10);

  return (
    <>
      <Head><title>Explorar · stiimpys.store</title></Head>
      <Header />

      <div style={{ display: 'flex', maxWidth: 1500, margin: '0 auto' }}>
        <FilterSidebar
          marcas={marcas} categorias={categorias} colores={colores}
          onChange={cargar}
        />

        <main style={{ flex: 1, minWidth: 0 }}>
          <div style={toolbar}>
            <span className="count" style={{ fontWeight: 700, color: 'var(--accent)' }}>{total}</span>
            &nbsp;prendas disponibles
          </div>

          {cargando ? (
            <p style={vacio}>Cargando…</p>
          ) : items.length === 0 ? (
            <p style={vacio}>No hay prendas que coincidan con estos filtros.</p>
          ) : (
            <div className="grid" style={{ padding: '2rem' }}>
              {items.map((p) => <ProductCard key={p._id} prenda={p} />)}
            </div>
          )}
        </main>
      </div>
    </>
  );
}

const toolbar = {
  padding: '1.2rem 2rem', borderBottom: '1px solid var(--border)',
  fontSize: 11, color: 'var(--muted)', letterSpacing: '.1em', textTransform: 'uppercase',
  background: 'rgba(255,255,255,.5)',
};
const vacio = { padding: '6rem 2rem', textAlign: 'center', fontSize: 12, color: 'var(--muted)', letterSpacing: '.15em', textTransform: 'uppercase' };
