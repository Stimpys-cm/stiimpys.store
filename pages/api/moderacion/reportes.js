/**
 * pages/api/moderacion/reportes.js
 *
 * POST -> cualquier usuario autenticado puede reportar
 * GET  -> lista de reportes pendientes (requiere RESOLVER_REPORTES)
 * PUT  -> resolver/descartar un reporte (requiere RESOLVER_REPORTES)
 */

const { ObjectId } = require('mongodb');
const { getDb } = require('../../../lib/db/_db');
const { requireAuth } = require('../../../lib/rbac/auth');
const { withGuards, requirePermiso } = require('../../../lib/rbac/guards');
const { PERMISOS } = require('../../../lib/rbac/constants');

async function handlerPost(req, res) {
  const { tipo, objetivoId, motivo } = req.body;
  if (!['prenda', 'usuario', 'tienda', 'resena'].includes(tipo) || !objetivoId) {
    return res.status(400).json({ error: 'tipo u objetivoId inválidos' });
  }

  const db = await getDb();
  await db.collection('reportes').insertOne({
    reportadoPor: req.usuario._id,
    tipo,
    objetivoId: new ObjectId(objetivoId),
    motivo: motivo || null,
    estado: 'pendiente',
    revisadoPor: null,
    resolucion: null,
    createdAt: new Date(),
    resueltoAt: null,
  });

  return res.status(201).json({ ok: true });
}

async function handlerGet(req, res) {
  const db = await getDb();
  const reportes = await db
    .collection('reportes')
    .find({ estado: { $in: ['pendiente', 'en_revision'] } })
    .sort({ createdAt: 1 })
    .toArray();
  return res.status(200).json(reportes);
}

async function handlerPut(req, res) {
  const { reporteId, estado, resolucion } = req.body;
  if (!['en_revision', 'resuelto', 'descartado'].includes(estado)) {
    return res.status(400).json({ error: 'estado inválido' });
  }

  const db = await getDb();
  await db.collection('reportes').updateOne(
    { _id: new ObjectId(reporteId) },
    {
      $set: {
        estado,
        resolucion: resolucion || null,
        revisadoPor: req.usuario._id,
        resueltoAt: ['resuelto', 'descartado'].includes(estado) ? new Date() : null,
      },
    }
  );

  return res.status(200).json({ ok: true });
}

export default async function (req, res) {
  if (req.method === 'POST') return requireAuth(handlerPost)(req, res);
  if (req.method === 'GET') {
    return withGuards([requirePermiso(PERMISOS.RESOLVER_REPORTES)], handlerGet)(req, res);
  }
  if (req.method === 'PUT') {
    return withGuards([requirePermiso(PERMISOS.RESOLVER_REPORTES)], handlerPut)(req, res);
  }
  return res.status(405).end();
}
