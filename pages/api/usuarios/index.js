/**
 * pages/api/usuarios/index.js
 * GET -> lista de usuarios para el panel de administración.
 * Solo SuperAdmin. Nunca devuelve passwordHash.
 */

const { getDb } = require('../../../lib/db/_db');
const { withGuards, requireRole } = require('../../../lib/rbac/guards');
const { ROLES } = require('../../../lib/rbac/constants');

async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const db = await getDb();
  const usuarios = await db
    .collection('usuarios')
    .find({}, { projection: { passwordHash: 0 } })
    .sort({ createdAt: -1 })
    .toArray();

  return res.status(200).json(usuarios);
}

export default withGuards([requireRole(ROLES.SUPERADMIN)], handler);
