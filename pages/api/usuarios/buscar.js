/**
 * pages/api/usuarios/buscar.js
 *
 * Busca usuarios por username (autocompletar al marcar una venta).
 * Requiere sesión. Devuelve solo datos públicos mínimos.
 */

const { getDb } = require('../../../lib/db/_db');
const { requireAuth } = require('../../../lib/rbac/auth');

async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const q = (req.query.q || '').trim();
  if (q.length < 2) return res.status(200).json([]);

  const db = await getDb();
  const usuarios = await db
    .collection('usuarios')
    .find(
      { username: { $regex: q, $options: 'i' } },
      { projection: { username: 1, avatarUrl: 1 }, limit: 8 }
    )
    .limit(8)
    .toArray();

  return res.status(200).json(usuarios);
}

export default requireAuth(handler);
