/**
 * pages/api/compras.js
 *
 * GET -> compras del usuario logueado (tab "Purchases").
 * Cada compra ya trae snapshot (titulo, foto, precio), así que
 * no necesita join con prendas para mostrarse.
 */

const { getDb } = require('../../lib/db/_db');
const { requireAuth } = require('../../lib/rbac/auth');

async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();

  const db = await getDb();
  const compras = await db
    .collection('compras')
    .aggregate([
      { $match: { compradorId: req.usuario._id } },
      { $sort: { createdAt: -1 } },
      {
        $lookup: {
          from: 'tiendas',
          localField: 'tiendaId',
          foreignField: '_id',
          as: 'tienda',
        },
      },
      { $unwind: { path: '$tienda', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          precio: 1, tituloPrenda: 1, fotoPrenda: 1, resenada: 1,
          createdAt: 1, prendaId: 1, tiendaId: 1,
          'tienda.nombre': 1, 'tienda.slug': 1,
        },
      },
    ])
    .toArray();

  return res.status(200).json(compras);
}

export default requireAuth(handler);
