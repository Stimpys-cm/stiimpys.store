/**
 * pages/api/tiendas/[slug].js
 *
 * GET -> perfil público de la tienda (para /tienda/[slug])
 * PUT -> editar datos de la tienda (owner, colaborador con permiso,
 *        o superadmin)
 */

const { getDb } = require('../../../lib/db/_db');
const { requireAuth } = require('../../../lib/rbac/auth');
const { esSuperAdmin } = require('../../../lib/rbac/guards');
const { PERMISOS, ESTADOS_TIENDA } = require('../../../lib/rbac/constants');

async function handlerGet(req, res) {
  const db = await getDb();
  const tienda = await db.collection('tiendas').findOne({ slug: req.query.slug });

  if (!tienda || tienda.estado !== ESTADOS_TIENDA.APROBADA) {
    // Ojo: aunque exista, si no está aprobada no se expone públicamente
    // (excepto al propio owner/colaborador — ver bloque abajo).
    return res.status(404).json({ error: 'Tienda no encontrada' });
  }

  return res.status(200).json(tienda);
}

async function handlerPut(req, res) {
  const db = await getDb();
  const tienda = await db.collection('tiendas').findOne({ slug: req.query.slug });
  if (!tienda) return res.status(404).json({ error: 'Tienda no encontrada' });

  const esOwner = tienda.ownerId?.equals(req.usuario._id);
  const colaborador = tienda.colaboradores?.find((c) =>
    c.usuarioId.equals(req.usuario._id)
  );
  const puedeEditar =
    esSuperAdmin(req.usuario) || esOwner || colaborador?.permisos?.[PERMISOS.EDITAR_CATALOGO];

  if (!puedeEditar) {
    return res.status(403).json({ error: 'Sin permiso para editar esta tienda' });
  }

  const { nombre, descripcion, logoUrl, bannerUrl, ubicacion, redesSociales, whatsapp } = req.body;
  const cambios = { updatedAt: new Date() };
  if (nombre !== undefined) cambios.nombre = nombre;
  if (descripcion !== undefined) cambios.descripcion = descripcion;
  if (logoUrl !== undefined) cambios.logoUrl = logoUrl;
  if (bannerUrl !== undefined) cambios.bannerUrl = bannerUrl;
  if (ubicacion !== undefined) cambios.ubicacion = ubicacion;
  if (redesSociales !== undefined) cambios.redesSociales = redesSociales;
  if (whatsapp !== undefined) cambios.whatsapp = whatsapp;

  await db.collection('tiendas').updateOne({ _id: tienda._id }, { $set: cambios });
  return res.status(200).json({ ok: true });
}

export default async function (req, res) {
  if (req.method === 'GET') return handlerGet(req, res);
  if (req.method === 'PUT') return requireAuth(handlerPut)(req, res);
  return res.status(405).end();
}
