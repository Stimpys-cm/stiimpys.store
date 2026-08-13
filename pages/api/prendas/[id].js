/**
 * pages/api/prendas/[id].js
 *
 * GET    -> detalle público de una prenda (sin costoInterno)
 * PUT    -> editar (requiere EDITAR_PRENDAS sobre la tienda dueña)
 * DELETE -> eliminar (requiere ELIMINAR_PRENDAS sobre la tienda dueña)
 *
 * Nota el patrón: `obtenerTiendaId` resuelve el dueño real del
 * recurso ANTES de decidir si el usuario tiene acceso — así
 * requireTiendaAccess no necesita saber nada de "prendas" en sí.
 */

const { ObjectId } = require('mongodb');
const { getDb } = require('../../../lib/db/_db');
const { withGuards, requireTiendaAccess } = require('../../../lib/rbac/guards');
const { PERMISOS } = require('../../../lib/rbac/constants');

async function obtenerTiendaIdDeLaPrenda(req) {
  const db = await getDb();
  const prenda = await db
    .collection('prendas')
    .findOne({ _id: new ObjectId(req.query.id) }, { projection: { tiendaId: 1 } });
  return prenda?.tiendaId;
}

async function handlerGet(req, res) {
  const db = await getDb();
  const prenda = await db.collection('prendas').findOne(
    { _id: new ObjectId(req.query.id) },
    { projection: { costoInterno: 0 } }
  );
  if (!prenda) return res.status(404).json({ error: 'Prenda no encontrada' });
  return res.status(200).json(prenda);
}

async function handlerEscritura(req, res) {
  const db = await getDb();
  const prendaId = new ObjectId(req.query.id);

  if (req.method === 'PUT') {
    const cambios = { ...req.body, updatedAt: new Date() };

    // Un colaborador sin permiso VER_COSTO_INTERNO no debería
    // poder escribir costoInterno tampoco — lo bloqueamos explícito
    // aunque el guard ya validó EDITAR_PRENDAS, porque son permisos
    // distintos.
    if (!req.usuario.permisos?.[PERMISOS.VER_COSTO_INTERNO] && !req.tienda) {
      delete cambios.costoInterno;
    }

    await db.collection('prendas').updateOne({ _id: prendaId }, { $set: cambios });
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    await db.collection('prendas').deleteOne({ _id: prendaId });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}

// PUT y DELETE requieren permisos distintos (EDITAR vs ELIMINAR).
// withGuards ya incluye requireAuth, así que no se envuelve dos veces.
export default async function (req, res) {
  if (req.method === 'GET') return handlerGet(req, res);

  if (['PUT', 'DELETE'].includes(req.method)) {
    const permisoRequerido =
      req.method === 'DELETE' ? PERMISOS.ELIMINAR_PRENDAS : PERMISOS.EDITAR_PRENDAS;

    return withGuards(
      [requireTiendaAccess(permisoRequerido, obtenerTiendaIdDeLaPrenda)],
      handlerEscritura
    )(req, res);
  }

  return res.status(405).end();
}
