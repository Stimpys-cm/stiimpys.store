/**
 * pages/admin/nueva-tienda.js  —  Solicitar una tienda nueva
 * La tienda nace en estado "pendiente" hasta que un moderador la
 * apruebe (POST /api/tiendas).
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../../components/Header';
import { useAuth } from '../../lib/useAuth';

export default function NuevaTienda() {
  const { usuario, cargando, refrescar } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ nombre: '', descripcion: '' });
  const [msg, setMsg] = useState('');
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!cargando && !usuario) router.replace('/login');
  }, [cargando, usuario, router]);

  const crear = async (e) => {
    e.preventDefault();
    setEnviando(true); setMsg('');
    try {
      const res = await fetch('/api/tiendas', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      await refrescar();
      setMsg('¡Solicitud enviada! Tu tienda quedará visible cuando un moderador la apruebe.');
    } catch (err) {
      setMsg(err.message);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <>
      <Head><title>Crear tienda · stiimpys.store</title></Head>
      <Header />
      <div style={{ maxWidth: 520, margin: '0 auto', padding: '3rem 2rem' }}>
        <p className="eyebrow">Vender en la plataforma</p>
        <h1 className="display" style={{ fontSize: '2.4rem', marginBottom: 24 }}>Crea tu tienda</h1>

        <form onSubmit={crear} className="panel" style={{ padding: '1.8rem' }}>
          <div className="field"><label>Nombre de la tienda</label><input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} required /></div>
          <div className="field"><label>Descripción</label><textarea rows={4} value={form.descripcion} onChange={(e) => setForm({ ...form, descripcion: e.target.value })} /></div>
          {msg && <p style={{ fontSize: 13, color: msg.includes('¡') ? 'var(--success)' : 'var(--danger)', marginBottom: 12 }}>{msg}</p>}
          <button className="btn btn-primary" style={{ width: '100%' }} disabled={enviando}>
            {enviando ? 'Enviando…' : 'Enviar solicitud'}
          </button>
        </form>
      </div>
    </>
  );
}
