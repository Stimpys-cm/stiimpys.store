/**
 * pages/api/auth/login.js
 */

const bcrypt = require('bcryptjs');
const { serialize } = require('cookie');
const { getDb } = require('../../../lib/db/_db');
const { generarToken, TOKEN_COOKIE_NAME } = require('../../../lib/rbac/auth');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Faltan credenciales' });
  }

  const db = await getDb();
  const usuario = await db.collection('usuarios').findOne({ username });

  if (!usuario || usuario.estado === 'baneado') {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const valido = await bcrypt.compare(password, usuario.passwordHash);
  if (!valido) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const token = generarToken(usuario);

  res.setHeader(
    'Set-Cookie',
    serialize(TOKEN_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 días, igual que el JWT
    })
  );

  return res.status(200).json({
    usuario: {
      _id: usuario._id,
      username: usuario.username,
      role: usuario.role,
      avatarUrl: usuario.avatarUrl,
    },
  });
}
