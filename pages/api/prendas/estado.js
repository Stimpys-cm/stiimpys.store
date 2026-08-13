/**
 * pages/api/prendas/estado.js
 *
 * Acción frecuente y separada de la edición general: cambiar
 * disponible <-> reservado <-> vendido. Usa el mismo permiso
 * EDITAR_PRENDAS (cambiar estado se considera parte de editar).
 */

const { ObjectId } = require('mongodb');
const { getDb } = require('../../../lib/db/_db');
const { withGuards, requireTiendaAccess } = require('../../../lib/rbac/guards');
const { PERMISOS, ESTADOS_PRENDA } = require('../../../lib/rbac/constants');

async function obtenerTiendaIdDeLaPrenda(req) {
  const db = await getDb();
  const prenda = await db
    .collection('prendas')
    .findOne({ _id: new ObjectId(req.body.prendaId) }, { projection: { tiendaId: 1 } });
  return prenda?.tiendaId;
}

async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).end();

  const { prendaId, nuevoEstado } = req.body;
  if (!Object.values(ESTADOS_PRENDA).includes(nuevoEstado)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  const db = await getDb();
  await db.collection('prendas').updateOne(
    { _id: new ObjectId(prendaId) },
    { $set: { estado: nuevoEstado, updatedAt: new Date() } }
  );

  return res.status(200).json({ ok: true });
}

export default withGuards(
  [requireTiendaAccess(PERMISOS.EDITAR_PRENDAS, obtenerTiendaIdDeLaPrenda)],
  handler
);
