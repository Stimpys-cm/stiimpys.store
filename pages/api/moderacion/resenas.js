/**
 * pages/api/moderacion/resenas.js
 *
 * POST -> cualquier usuario autenticado deja una reseña a una tienda
 * PUT  -> moderador con MODERAR_RESENAS oculta una reseña reportada
 */

const { ObjectId } = require('mongodb');
const { getDb } = require('../../../lib/db/_db');
const { requireAuth } = require('../../../lib/rbac/auth');
const { withGuards, requirePermiso } = require('../../../lib/rbac/guards');
const { PERMISOS } = require('../../../lib/rbac/constants');

async function handlerPost(req, res) {
  const { tiendaId, calificacion, comentario } = req.body;
  if (!tiendaId || calificacion < 1 || calificacion > 5) {
    return res.status(400).json({ error: 'tiendaId o calificacion inválidos' });
  }

  const db = await getDb();
  await db.collection('resenas').insertOne({
    tiendaId: new ObjectId(tiendaId),
    usuarioId: req.usuario._id,
    calificacion: Number(calificacion),
    comentario: comentario || null,
    estado: 'visible',
    createdAt: new Date(),
  });

  // Recalcula el promedio de la tienda (simple, sin agregación pesada
  // en este endpoint; para volumen alto conviene mover esto a un job).
  const stats = await db
    .collection('resenas')
    .aggregate([
      { $match: { tiendaId: new ObjectId(tiendaId), estado: 'visible' } },
      { $group: { _id: null, promedio: { $avg: '$calificacion' } } },
    ])
    .toArray();

  await db.collection('tiendas').updateOne(
    { _id: new ObjectId(tiendaId) },
    { $set: { calificacionPromedio: stats[0]?.promedio || null } }
  );

  return res.status(201).json({ ok: true });
}

async function handlerPut(req, res) {
  const { resenaId } = req.body;
  const db = await getDb();
  await db.collection('resenas').updateOne(
    { _id: new ObjectId(resenaId) },
    { $set: { estado: 'oculta_por_moderacion' } }
  );
  return res.status(200).json({ ok: true });
}

export default async function (req, res) {
  if (req.method === 'POST') return requireAuth(handlerPost)(req, res);
  if (req.method === 'PUT') {
    return withGuards([requirePermiso(PERMISOS.MODERAR_RESENAS)], handlerPut)(req, res);
  }
  return res.status(405).end();
}
