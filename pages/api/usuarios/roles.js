/**
 * pages/api/usuarios/roles.js
 *
 * Solo SuperAdmin puede cambiar el rol de un usuario.
 * Al cambiar de rol, se resetean sus permisos a los defaults de
 * ese rol (evita que un ex-moderador conserve permisos de
 * moderación al degradarlo a cliente, por ejemplo).
 */

const { ObjectId } = require('mongodb');
const { getDb } = require('../../../lib/db/_db');
const { withGuards, requireRole } = require('../../../lib/rbac/guards');
const { ROLES, PERMISOS_DEFAULT_POR_ROL } = require('../../../lib/rbac/constants');

async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).end();

  const { usuarioId, nuevoRol } = req.body;

  if (!usuarioId || !Object.values(ROLES).includes(nuevoRol)) {
    return res.status(400).json({ error: 'usuarioId o nuevoRol inválido' });
  }

  // Nadie, ni siquiera un superadmin por accidente vía UI, puede
  // quitarse a sí mismo el rol de superadmin sin querer si es el único.
  if (req.usuario._id.toString() === usuarioId && nuevoRol !== ROLES.SUPERADMIN) {
    const db = await getDb();
    const totalSuperadmins = await db
      .collection('usuarios')
      .countDocuments({ role: ROLES.SUPERADMIN });
    if (totalSuperadmins <= 1) {
      return res.status(400).json({
        error: 'No puedes quitarte el rol de superadmin: eres el único activo',
      });
    }
  }

  const db = await getDb();
  await db.collection('usuarios').updateOne(
    { _id: new ObjectId(usuarioId) },
    {
      $set: {
        role: nuevoRol,
        permisos: PERMISOS_DEFAULT_POR_ROL[nuevoRol] || {},
        updatedAt: new Date(),
      },
    }
  );

  return res.status(200).json({ ok: true });
}

export default withGuards([requireRole(ROLES.SUPERADMIN)], handler);
