/**
 * pages/api/favoritos.js
 *
 * GET    -> favoritos del usuario logueado (para el tab "Favorites")
 * POST   -> marcar prenda como favorita
 * DELETE -> desmarcar
 */

const { ObjectId } = require('mongodb');
const { getDb } = require('../../lib/db/_db');
const { requireAuth } = require('../../lib/rbac/auth');

async function handler(req, res) {
  const db = await getDb();

  if (req.method === 'GET') {
    const favoritos = await db
      .collection('favoritos')
      .aggregate([
        { $match: { usuarioId: req.usuario._id } },
        {
          $lookup: {
            from: 'prendas',
            localField: 'prendaId',
            foreignField: '_id',
            as: 'prenda',
          },
        },
        { $unwind: '$prenda' },
        { $project: { 'prenda.costoInterno': 0 } },
      ])
      .toArray();
    return res.status(200).json(favoritos);
  }

  if (req.method === 'POST') {
    const { prendaId } = req.body;
    await db.collection('favoritos').updateOne(
      { usuarioId: req.usuario._id, prendaId: new ObjectId(prendaId) },
      { $setOnInsert: { createdAt: new Date() } },
      { upsert: true }
    );
    return res.status(200).json({ ok: true });
  }

  if (req.method === 'DELETE') {
    const { prendaId } = req.body;
    await db.collection('favoritos').deleteOne({
      usuarioId: req.usuario._id,
      prendaId: new ObjectId(prendaId),
    });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}

export default requireAuth(handler);
