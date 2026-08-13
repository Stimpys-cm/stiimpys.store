/**
 * components/FilterSidebar.jsx
 * Filtros laterales estilo Grailed: Departamento, Categoría, Talla,
 * Marca, Color, Precio. Notifica cambios al padre vía onChange.
 */

import { useState } from 'react';
import { useAuth } from '../lib/useAuth';

const DEPARTAMENTOS = ['menswear', 'womenswear', 'unisex'];
const TALLAS = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36'];

export default function FilterSidebar({ marcas = [], categorias = [], colores = [], onChange }) {
  const { usuario } = useAuth();
  const [filtros, setFiltros] = useState({});
  const [misTallasActivo, setMisTallasActivo] = useState(false);

  const set = (clave, valor) => {
    const next = { ...filtros };
    if (!valor || next[clave] === valor) delete next[clave];
    else next[clave] = valor;
    setFiltros(next);
    onChange(next);
  };

  // ADD MY SIZES: filtra por las tallas guardadas en el perfil del usuario.
  // El backend acepta una talla; para varias, mandamos la lista separada
  // por coma y el catálogo filtra con $in (ver pages/api/prendas/index.js).
  const toggleMisTallas = () => {
    const activar = !misTallasActivo;
    setMisTallasActivo(activar);
    const next = { ...filtros };
    if (activar && usuario?.misTallas?.length) {
      next.talla = usuario.misTallas.join(',');
    } else {
      delete next.talla;
    }
    setFiltros(next);
    onChange(next);
  };

  const limpiar = () => { setFiltros({}); setMisTallasActivo(false); onChange({}); };

  const Grupo = ({ titulo, clave, opciones }) => (
    <div style={{ marginBottom: 26 }}>
      <div className="eyebrow" style={{ marginBottom: 10 }}>{titulo}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {opciones.map((op) => (
          <button
            key={op}
            onClick={() => set(clave, op)}
            className="cat-chip"
            style={{
              cursor: 'pointer',
              background: filtros[clave] === op ? 'var(--accent)' : 'rgba(45,107,228,.08)',
              color: filtros[clave] === op ? '#fff' : 'var(--accent)',
              textTransform: 'capitalize',
            }}
          >
            {op}
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <aside style={{ width: 240, flexShrink: 0, padding: '2rem 1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <strong style={{ fontSize: 13, letterSpacing: '.1em', textTransform: 'uppercase' }}>Filtros</strong>
        {Object.keys(filtros).length > 0 && (
          <button onClick={limpiar} style={{ background: 'none', border: 'none', color: 'var(--danger)', fontSize: 10, fontWeight: 700, letterSpacing: '.1em', textTransform: 'uppercase' }}>
            Limpiar
          </button>
        )}
      </div>

      {/* ── ADD MY SIZES ── */}
      {usuario && (
        <button
          onClick={usuario.misTallas?.length ? toggleMisTallas : undefined}
          disabled={!usuario.misTallas?.length}
          className="btn"
          style={{
            width: '100%', marginBottom: 24, padding: '12px',
            background: misTallasActivo ? 'var(--accent-gradient)' : '#fff',
            color: misTallasActivo ? '#fff' : 'var(--accent)',
            border: '1.5px solid var(--accent)',
            opacity: usuario.misTallas?.length ? 1 : .5,
            cursor: usuario.misTallas?.length ? 'pointer' : 'not-allowed',
          }}
          title={usuario.misTallas?.length ? '' : 'Guarda tus tallas en tu perfil primero'}
        >
          {misTallasActivo ? '✓ Filtrando por mis tallas' : '+ Add my sizes'}
        </button>
      )}

      <Grupo titulo="Departamento" clave="departamento" opciones={DEPARTAMENTOS} />
      {categorias.length > 0 && <Grupo titulo="Categoría" clave="categoria" opciones={categorias} />}
      <Grupo titulo="Talla" clave="talla" opciones={TALLAS} />
      {marcas.length > 0 && <Grupo titulo="Marca" clave="marca" opciones={marcas} />}
      {colores.length > 0 && <Grupo titulo="Color" clave="color" opciones={colores} />}

      <div style={{ marginBottom: 20 }}>
        <div className="eyebrow" style={{ marginBottom: 10 }}>Precio</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="number" placeholder="Mín"
            onChange={(e) => set('precioMin', e.target.value)}
            style={{ width: '50%', padding: '8px 10px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13 }}
          />
          <input
            type="number" placeholder="Máx"
            onChange={(e) => set('precioMax', e.target.value)}
            style={{ width: '50%', padding: '8px 10px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13 }}
          />
        </div>
      </div>
    </aside>
  );
}
