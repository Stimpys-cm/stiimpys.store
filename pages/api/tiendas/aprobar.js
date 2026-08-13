/**
 * pages/api/tiendas/aprobar.js
 *
 * Solo moderadores con PERMISOS.APROBAR_TIENDAS (o superadmin)
 * pueden aprobar/rechazar una tienda en estado "pendiente".
 */

const { ObjectId } = require('mongodb');
const { getDb } = require('../../../lib/db/_db');
const { withGuards, requirePermiso } = require('../../../lib/rbac/guards');
const { PERMISOS, ESTADOS_TIENDA } = require('../../../lib/rbac/constants');

async function handler(req, res) {
  if (req.method !== 'PUT') return res.status(405).end();

  const { tiendaId, decision, motivoRechazo } = req.body; // decision: "aprobar" | "rechazar"
  if (!tiendaId || !['aprobar', 'rechazar'].includes(decision)) {
    return res.status(400).json({ error: 'tiendaId o decision inválidos' });
  }

  const db = await getDb();
  const tienda = await db.collection('tiendas').findOne({ _id: new ObjectId(tiendaId) });
  if (!tienda) return res.status(404).json({ error: 'Tienda no encontrada' });
  if (tienda.estado !== ESTADOS_TIENDA.PENDIENTE) {
    return res.status(400).json({ error: 'Esta tienda ya fue revisada' });
  }

  const nuevoEstado =
    decision === 'aprobar' ? ESTADOS_TIENDA.APROBADA : ESTADOS_TIENDA.RECHAZADA;

  await db.collection('tiendas').updateOne(
    { _id: tienda._id },
    {
      $set: {
        estado: nuevoEstado,
        revisadoPor: req.usuario._id,
        motivoRechazo: decision === 'rechazar' ? motivoRechazo || null : null,
        updatedAt: new Date(),
      },
    }
  );

  return res.status(200).json({ ok: true, estado: nuevoEstado });
}

export default withGuards([requirePermiso(PERMISOS.APROBAR_TIENDAS)], handler);
