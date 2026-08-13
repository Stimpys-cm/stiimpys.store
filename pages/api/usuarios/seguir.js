/**
 * pages/api/usuarios/seguir.js
 */

const { ObjectId } = require('mongodb');
const { getDb } = require('../../../lib/db/_db');
const { requireAuth } = require('../../../lib/rbac/auth');

async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { objetivoId, accion } = req.body; // accion: "seguir" | "dejar_de_seguir"
  if (!objetivoId || !['seguir', 'dejar_de_seguir'].includes(accion)) {
    return res.status(400).json({ error: 'objetivoId o accion inválidos' });
  }
  if (objetivoId === req.usuario._id.toString()) {
    return res.status(400).json({ error: 'No puedes seguirte a ti mismo' });
  }

  const db = await getDb();
  const objetivo = new ObjectId(objetivoId);
  const operador = accion === 'seguir' ? '$addToSet' : '$pull';

  await Promise.all([
    db.collection('usuarios').updateOne(
      { _id: req.usuario._id },
      { [operador]: { siguiendo: objetivo } }
    ),
    db.collection('usuarios').updateOne(
      { _id: objetivo },
      { [operador]: { seguidores: req.usuario._id } }
    ),
  ]);

  return res.status(200).json({ ok: true });
}

export default requireAuth(handler);
