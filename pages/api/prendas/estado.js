/**
 * pages/api/prendas/estado.js
 *
 * Cambia el estado de una prenda (disponible/reservado/vendido).
 * Si el nuevo estado es "vendido" y se envía compradorId, registra
 * la compra en la colección `compras` (alimenta el tab Purchases del
 * comprador) y guarda un snapshot de la prenda.
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

  const { prendaId, nuevoEstado, compradorId } = req.body;
  if (!Object.values(ESTADOS_PRENDA).includes(nuevoEstado)) {
    return res.status(400).json({ error: 'Estado inválido' });
  }

  const db = await getDb();
  const _prendaId = new ObjectId(prendaId);

  const prenda = await db.collection('prendas').findOne({ _id: _prendaId });
  if (!prenda) return res.status(404).json({ error: 'Prenda no encontrada' });

  await db.collection('prendas').updateOne(
    { _id: _prendaId },
    { $set: { estado: nuevoEstado, updatedAt: new Date() } }
  );

  // Si se marca como vendida a un comprador concreto -> registrar compra.
  // Evita duplicados: si ya hay compra para esta prenda, no crea otra.
  if (nuevoEstado === ESTADOS_PRENDA.VENDIDO && compradorId) {
    const yaExiste = await db.collection('compras').findOne({ prendaId: _prendaId });
    if (!yaExiste) {
      await db.collection('compras').insertOne({
        prendaId: _prendaId,
        tiendaId: prenda.tiendaId,
        compradorId: new ObjectId(compradorId),
        vendedorId: req.usuario._id,
        precio: prenda.precio,
        tituloPrenda: prenda.titulo || null,
        fotoPrenda: prenda.fotos?.[0] || null,
        resenada: false,
        createdAt: new Date(),
      });

      // Suma una transacción a la tienda
      await db.collection('tiendas').updateOne(
        { _id: prenda.tiendaId },
        { $inc: { totalVentas: 1 } }
      );
    }
  }

  return res.status(200).json({ ok: true });
}

export default withGuards(
  [requireTiendaAccess(PERMISOS.EDITAR_PRENDAS, obtenerTiendaIdDeLaPrenda)],
  handler
);
