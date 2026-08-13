/**
 * pages/login.js  —  Ingreso y registro
 * Estética del login original: tarjeta centrada sobre crema,
 * logo Bebas Neue, marquee de fondo tenue.
 */

import { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { useAuth } from '../lib/useAuth';

export default function Login() {
  const { login, refrescar } = useAuth();
  const router = useRouter();
  const [modo, setModo] = useState('login'); // 'login' | 'registro'
  const [form, setForm] = useState({ username: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setCargando(true);
    try {
      if (modo === 'registro') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form),
        });
        if (!res.ok) throw new Error((await res.json()).error);
      }
      await login(form.username, form.password);
      router.push('/');
    } catch (err) {
      setError(err.message || 'Error');
    } finally {
      setCargando(false);
    }
  };

  return (
    <>
      <Head><title>{modo === 'login' ? 'Ingresar' : 'Crear cuenta'} · stiimpys.store</title></Head>

      <div style={wrap}>
        <div className="bg-marquee" style={bgMarquee}>
          <div style={{ textAlign: 'left' }}><span style={ghost}>STIIMPYS.STORE&nbsp;</span></div>
          <div style={{ textAlign: 'right' }}><span style={ghost}>VINTAGE STREETWEAR&nbsp;</span></div>
        </div>

        <div className="panel" style={cardStyle}>
          <p className="eyebrow" style={{ marginBottom: 16 }}>
            {modo === 'login' ? 'Bienvenido de vuelta' : 'Únete a la comunidad'}
          </p>
          <div className="display" style={{ fontSize: 42, marginBottom: 6 }}>
            STIIMPYS<span style={{ color: 'var(--accent)' }}>.STORE</span>
          </div>
          <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 30 }}>
            {modo === 'login' ? 'Ingresa a tu cuenta' : 'Crea tu cuenta gratis'}
          </p>

          <form onSubmit={submit} style={{ textAlign: 'left' }}>
            <div className="field">
              <label>Usuario</label>
              <input value={form.username} onChange={set('username')} required />
            </div>
            {modo === 'registro' && (
              <div className="field">
                <label>Email</label>
                <input type="email" value={form.email} onChange={set('email')} required />
              </div>
            )}
            <div className="field">
              <label>Contraseña</label>
              <input type="password" value={form.password} onChange={set('password')} required />
            </div>

            {error && <p style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 14 }}>{error}</p>}

            <button className="btn btn-primary" style={{ width: '100%', padding: 14 }} disabled={cargando}>
              {cargando ? 'Un momento…' : modo === 'login' ? 'Ingresar' : 'Crear cuenta'}
            </button>
          </form>

          <p style={{ marginTop: 22, fontSize: 13, color: 'var(--muted)' }}>
            {modo === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
            <button
              onClick={() => { setModo(modo === 'login' ? 'registro' : 'login'); setError(''); }}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', fontWeight: 700 }}
            >
              {modo === 'login' ? 'Regístrate' : 'Ingresa'}
            </button>
          </p>
        </div>
      </div>
    </>
  );
}

const wrap = { minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, position: 'relative', overflow: 'hidden' };
const bgMarquee = { position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px 0', pointerEvents: 'none', opacity: .06, zIndex: 0 };
const ghost = { fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(48px,10vw,120px)', whiteSpace: 'nowrap', lineHeight: 1, textTransform: 'uppercase', color: 'var(--accent)' };
const cardStyle = { position: 'relative', zIndex: 1, width: '100%', maxWidth: 420, padding: '44px 32px', textAlign: 'center' };
