/**
 * pages/admin/[tiendaId].js  —  Panel privado de una tienda
 *
 * Inventario + formulario de alta de prendas. Los botones de acción
 * son solo UX: el backend revalida PUBLICAR_PRENDAS/EDITAR_PRENDAS
 * sobre esta tiendaId en cada request (requireTiendaAccess).
 */

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../../components/Header';
import { useAuth } from '../../lib/useAuth';
import { ESTADOS_PRENDA } from '../../lib/rbac/constants';

const VACIO = { titulo: '', marca: '', departamento: 'menswear', categoria: '', talla: '', color: '', precio: '', condicion: 'usado', fotos: [] };

export default function AdminTienda() {
  const { usuario, cargando } = useAuth();
  const router = useRouter();
  const { tiendaId } = router.query;

  const [prendas, setPrendas] = useState([]);
  const [form, setForm] = useState(VACIO);
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [msg, setMsg] = useState('');

  // Sube uno o varios archivos a Cloudinary vía /api/upload y guarda
  // las URLs resultantes en form.fotos (máximo 6, como el esquema).
  const subirFotos = async (e) => {
    const archivos = Array.from(e.target.files || []);
    if (archivos.length === 0) return;
    setSubiendo(true); setMsg('');
    try {
      const nuevas = [];
      for (const archivo of archivos) {
        if (form.fotos.length + nuevas.length >= 6) break;
        const base64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(archivo);
        });
        const res = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ file: base64 }),
        });
        if (!res.ok) throw new Error((await res.json()).error || 'Error al subir');
        const { url } = await res.json();
        nuevas.push(url);
      }
      setForm((f) => ({ ...f, fotos: [...f.fotos, ...nuevas].slice(0, 6) }));
    } catch (err) {
      setMsg(err.message);
    } finally {
      setSubiendo(false);
      e.target.value = ''; // permite volver a elegir el mismo archivo
    }
  };

  const quitarFoto = (url) => {
    setForm((f) => ({ ...f, fotos: f.fotos.filter((u) => u !== url) }));
  };

  useEffect(() => {
    if (!cargando && !usuario) router.replace('/login');
  }, [cargando, usuario, router]);

  const cargar = useCallback(async () => {
    if (!tiendaId) return;
    const res = await fetch(`/api/prendas?tiendaId=${tiendaId}&limit=100`);
    const data = await res.json();
    setPrendas(data.items || []);
  }, [tiendaId]);

  useEffect(() => { cargar(); }, [cargar]);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const publicar = async (e) => {
    e.preventDefault();
    setGuardando(true); setMsg('');
    try {
      const res = await fetch('/api/prendas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, tiendaId, precio: Number(form.precio) }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      setForm(VACIO); setMsg('Prenda publicada ✓'); cargar();
    } catch (err) {
      setMsg(err.message);
    } finally {
      setGuardando(false);
    }
  };

  // Modal de "vender a X usuario"
  const [ventaModal, setVentaModal] = useState(null); // { prendaId }
  const [buscar, setBuscar] = useState('');
  const [resultados, setResultados] = useState([]);

  const cambiarEstado = async (prendaId, nuevoEstado) => {
    // Al marcar como vendida, primero preguntamos a quién
    if (nuevoEstado === 'vendido') {
      setVentaModal({ prendaId });
      setBuscar(''); setResultados([]);
      return;
    }
    await fetch('/api/prendas/estado', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prendaId, nuevoEstado }),
    });
    cargar();
  };

  // Autocompletar comprador
  useEffect(() => {
    if (!ventaModal || buscar.trim().length < 2) { setResultados([]); return; }
    const t = setTimeout(async () => {
      const r = await fetch(`/api/usuarios/buscar?q=${encodeURIComponent(buscar)}`);
      if (r.ok) setResultados(await r.json());
    }, 300);
    return () => clearTimeout(t);
  }, [buscar, ventaModal]);

  const confirmarVenta = async (compradorId) => {
    await fetch('/api/prendas/estado', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prendaId: ventaModal.prendaId, nuevoEstado: 'vendido', compradorId }),
    });
    setVentaModal(null);
    cargar();
  };

  const eliminar = async (prendaId) => {
    if (!confirm('¿Eliminar esta prenda?')) return;
    await fetch(`/api/prendas/${prendaId}`, { method: 'DELETE' });
    cargar();
  };

  if (cargando || !usuario) return (<><Header /><p style={{ padding: '5rem', textAlign: 'center' }}>Cargando…</p></>);

  return (
    <>
      <Head><title>Gestión de tienda · stiimpys.store</title></Head>
      <Header />

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem 2rem', display: 'grid', gridTemplateColumns: '340px 1fr', gap: 32, alignItems: 'start' }}>
        {/* Formulario de alta */}
        <form onSubmit={publicar} className="panel" style={{ padding: '1.8rem' }}>
          <p className="eyebrow" style={{ marginBottom: 16 }}>Nueva prenda</p>

          <div className="field"><label>Título</label><input value={form.titulo} onChange={set('titulo')} required /></div>
          <div className="field"><label>Marca</label><input value={form.marca} onChange={set('marca')} /></div>
          <div className="field">
            <label>Departamento</label>
            <select value={form.departamento} onChange={set('departamento')}>
              <option value="menswear">Menswear</option>
              <option value="womenswear">Womenswear</option>
              <option value="unisex">Unisex</option>
            </select>
          </div>
          <div className="field"><label>Categoría</label><input value={form.categoria} onChange={set('categoria')} placeholder="Jackets, Denim…" /></div>
          <div style={{ display: 'flex', gap: 12 }}>
            <div className="field" style={{ flex: 1 }}><label>Talla</label><input value={form.talla} onChange={set('talla')} /></div>
            <div className="field" style={{ flex: 1 }}><label>Color</label><input value={form.color} onChange={set('color')} /></div>
          </div>
          <div className="field"><label>Precio (MXN)</label><input type="number" value={form.precio} onChange={set('precio')} required /></div>

          {/* ── Subida de fotos a Cloudinary ── */}
          <div className="field">
            <label>Fotos ({form.fotos.length}/6)</label>
            {form.fotos.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
                {form.fotos.map((url) => (
                  <div key={url} style={{ position: 'relative', width: 60, height: 80, borderRadius: 8, overflow: 'hidden', border: '1.5px solid var(--border)' }}>
                    <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <button type="button" onClick={() => quitarFoto(url)}
                      style={{ position: 'absolute', top: 2, right: 2, width: 18, height: 18, borderRadius: '50%', background: 'rgba(26,31,46,.8)', color: '#fff', border: 'none', fontSize: 11, lineHeight: 1, cursor: 'pointer' }}>×</button>
                  </div>
                ))}
              </div>
            )}
            {form.fotos.length < 6 && (
              <label className="btn btn-ghost" style={{ cursor: subiendo ? 'wait' : 'pointer', width: '100%' }}>
                {subiendo ? 'Subiendo…' : '+ Agregar fotos'}
                <input type="file" accept="image/*" multiple onChange={subirFotos} disabled={subiendo} style={{ display: 'none' }} />
              </label>
            )}
          </div>

          {msg && <p style={{ fontSize: 13, color: msg.includes('✓') ? 'var(--success)' : 'var(--danger)', marginBottom: 12 }}>{msg}</p>}
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={guardando || subiendo}>
            {guardando ? 'Publicando…' : 'Publicar prenda'}
          </button>
        </form>

        {/* Inventario */}
        <div>
          <p className="eyebrow" style={{ marginBottom: 16 }}>Inventario ({prendas.length})</p>
          {prendas.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>Aún no hay prendas en esta tienda.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {prendas.map((p) => (
                <div key={p._id} className="panel" style={fila}>
                  <div style={{ flex: 1 }}>
                    <strong style={{ fontSize: 14, textTransform: 'uppercase' }}>{p.titulo}</strong>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
                      {p.marca} · Talla {p.talla || '—'} · ${Number(p.precio).toLocaleString('es-MX')}
                    </div>
                  </div>
                  <span className={`estado-chip estado-${p.estado}`}>{p.estado}</span>
                  <select value={p.estado} onChange={(e) => cambiarEstado(p._id, e.target.value)} style={{ padding: '6px 8px', borderRadius: 8, border: '1.5px solid var(--border)', fontSize: 12 }}>
                    {Object.values(ESTADOS_PRENDA).map((es) => <option key={es} value={es}>{es}</option>)}
                  </select>
                  <button onClick={() => eliminar(p._id)} className="btn btn-danger" style={{ padding: '7px 12px' }}>🗑</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal: vender a un usuario ── */}
      {ventaModal && (
        <div style={modalBg} onClick={() => setVentaModal(null)}>
          <div className="panel" style={modalBox} onClick={(e) => e.stopPropagation()}>
            <p className="eyebrow" style={{ marginBottom: 8 }}>Marcar como vendida</p>
            <h3 className="display" style={{ fontSize: '1.6rem', marginBottom: 4 }}>¿A quién se la vendiste?</h3>
            <p style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 16 }}>
              Busca al comprador por su usuario. Aparecerá en sus compras.
            </p>

            <input
              autoFocus value={buscar} onChange={(e) => setBuscar(e.target.value)}
              placeholder="Buscar usuario…"
              style={{ width: '100%', padding: '11px 14px', border: '1.5px solid var(--border)', borderRadius: 10, fontSize: 14, marginBottom: 12 }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
              {resultados.map((u) => (
                <button key={u._id} onClick={() => confirmarVenta(u._id)} style={resultRow}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: u.avatarUrl ? `url(${u.avatarUrl}) center/cover` : 'var(--accent-gradient)' }} />
                  <span style={{ fontWeight: 600 }}>{u.username}</span>
                </button>
              ))}
              {buscar.length >= 2 && resultados.length === 0 && (
                <p style={{ fontSize: 12, color: 'var(--muted)', padding: '8px 0' }}>Sin resultados.</p>
              )}
            </div>

            <button onClick={() => setVentaModal(null)} className="btn btn-ghost" style={{ width: '100%', marginTop: 16 }}>Cancelar</button>
          </div>
        </div>
      )}
    </>
  );
}

const fila = { display: 'flex', alignItems: 'center', gap: 12, padding: '1rem 1.2rem' };
const modalBg = { position: 'fixed', inset: 0, background: 'rgba(26,31,46,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 20 };
const modalBox = { width: '100%', maxWidth: 420, padding: '1.8rem' };
const resultRow = { display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px', background: 'none', border: '1px solid var(--border)', borderRadius: 10, cursor: 'pointer', textAlign: 'left', fontSize: 14 };
