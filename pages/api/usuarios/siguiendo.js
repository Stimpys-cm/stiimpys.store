/**
 * pages/api/usuarios/siguiendo.js
 *
 * GET -> lista de usuarios que sigue un usuario dado (?usuarioId=...)
 * o el logueado por defecto. Alimenta el tab "Following".
 */

const { ObjectId } = require('mongodb');
const { getDb } = require('../../../lib/db/_db');
const { getUsuarioActual } = require('../../../lib/rbac/auth');

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const db = await getDb();

  let objetivoId = req.query.usuarioId ? new ObjectId(req.query.usuarioId) : null;
  if (!objetivoId) {
    const actual = await getUsuarioActual(req);
    if (!actual) return res.status(401).json({ error: 'No autenticado' });
    objetivoId = actual._id;
  }

  const usuario = await db
    .collection('usuarios')
    .findOne({ _id: objetivoId }, { projection: { siguiendo: 1 } });

  const ids = usuario?.siguiendo || [];
  if (ids.length === 0) return res.status(200).json([]);

  const seguidos = await db
    .collection('usuarios')
    .find(
      { _id: { $in: ids } },
      { projection: { username: 1, avatarUrl: 1, ubicacion: 1 } }
    )
    .toArray();

  return res.status(200).json(seguidos);
}
