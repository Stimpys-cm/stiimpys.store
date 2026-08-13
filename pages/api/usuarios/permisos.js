/**
 * pages/api/usuarios/permisos.js
 *
 * Otorga o revoca UN permiso granular sin tocar los demás
 * (a diferencia de roles.js, que resetea todo el objeto permisos).
 * Esto es lo que alimenta el panel "asignar qué puede hacer cada
 * moderador/admin de tienda" que pediste.
 */

const { ObjectId } = require('mongodb');
const { getDb } = require('../../../lib/db/_db');
const { withGuards, requireRole } = require('../../../lib/rbac/guards');
const { ROLES, PERMISOS } = require('../../../lib/rbac/constants');

async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).end();

  const { usuarioId, permiso, valor } = req.body;

  if (
    !usuarioId ||
    !Object.values(PERMISOS).includes(permiso) ||
    typeof valor !== 'boolean'
  ) {
    return res.status(400).json({ error: 'usuarioId, permiso o valor inválido' });
  }

  const db = await getDb();
  const usuarioObjetivo = await db
    .collection('usuarios')
    .findOne({ _id: new ObjectId(usuarioId) });

  if (!usuarioObjetivo) {
    return res.status(404).json({ error: 'Usuario no encontrado' });
  }

  // No tiene sentido otorgar permisos de moderación/tienda a un
  // "cliente" puro — evita estados inconsistentes desde el propio API.
  if (usuarioObjetivo.role === ROLES.CLIENTE) {
    return res.status(400).json({
      error: 'Asigna primero un rol (moderador/admin_tienda) antes de otorgar permisos',
    });
  }

  await db.collection('usuarios').updateOne(
    { _id: new ObjectId(usuarioId) },
    {
      $set: {
        [`permisos.${permiso}`]: valor,
        updatedAt: new Date(),
      },
    }
  );

  return res.status(200).json({ ok: true });
}

export default withGuards([requireRole(ROLES.SUPERADMIN)], handler);
