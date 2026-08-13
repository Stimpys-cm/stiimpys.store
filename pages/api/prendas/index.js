/**
 * pages/api/prendas/index.js
 *
 * GET  -> catálogo público con filtros (Department/Category/Size/
 *         Brand/Color/Price) vía query params, para el sidebar
 *         estilo Grailed.
 * POST -> crear prenda dentro de una tienda (requiere PUBLICAR_PRENDAS
 *         sobre esa tienda puntual).
 */

const { ObjectId } = require('mongodb');
const { getDb } = require('../../../lib/db/_db');
const { withGuards, requireTiendaAccess } = require('../../../lib/rbac/guards');
const { PERMISOS, ESTADOS_PRENDA } = require('../../../lib/rbac/constants');

async function handlerGet(req, res) {
  const db = await getDb();
  const {
    departamento,
    categoria,
    talla,
    marca,
    color,
    precioMin,
    precioMax,
    q, // búsqueda de texto libre
    tiendaId,
    limit = 24,
    skip = 0,
  } = req.query;

  const filtro = { estado: ESTADOS_PRENDA.DISPONIBLE };

  if (departamento) filtro.departamento = departamento;
  if (categoria) filtro.categoria = categoria;
  // talla puede venir como "M" o como lista "M,L,XL" (ADD MY SIZES)
  if (talla) {
    const tallas = talla.split(',').map((t) => t.trim()).filter(Boolean);
    filtro.talla = tallas.length > 1 ? { $in: tallas } : tallas[0];
  }
  if (marca) filtro.marca = marca;
  if (color) filtro.color = color;
  if (tiendaId) filtro.tiendaId = new ObjectId(tiendaId);

  if (precioMin || precioMax) {
    filtro.precio = {};
    if (precioMin) filtro.precio.$gte = Number(precioMin);
    if (precioMax) filtro.precio.$lte = Number(precioMax);
  }

  if (q) {
    filtro.$text = { $search: q };
  }

  // costoInterno nunca se expone en el catálogo público, sin importar
  // quién pregunte — para eso está el panel de admin de la tienda.
  const proyeccion = { costoInterno: 0 };

  const [items, total] = await Promise.all([
    db
      .collection('prendas')
      .find(filtro, { projection: proyeccion })
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Math.min(Number(limit), 100))
      .toArray(),
    db.collection('prendas').countDocuments(filtro),
  ]);

  return res.status(200).json({ items, total });
}

async function obtenerTiendaIdDelBody(req) {
  return req.body.tiendaId ? new ObjectId(req.body.tiendaId) : null;
}

async function handlerPost(req, res) {
  const db = await getDb();
  const { titulo, descripcion, marca, departamento, categoria, talla, color, precio, costoInterno, condicion, fotos } = req.body;

  if (!titulo || precio === undefined) {
    return res.status(400).json({ error: 'Faltan titulo o precio' });
  }

  const nuevaPrenda = {
    tiendaId: req.tienda._id, // adjuntado por requireTiendaAccess
    titulo,
    descripcion: descripcion || null,
    marca: marca || null,
    departamento: departamento || null,
    categoria: categoria || null,
    talla: talla || null,
    color: color || null,
    precio: Number(precio),
    costoInterno: req.usuario.permisos?.[PERMISOS.VER_COSTO_INTERNO]
      ? Number(costoInterno) || null
      : null,
    condicion: condicion || null,
    fotos: fotos || [],
    estado: ESTADOS_PRENDA.DISPONIBLE,
    publicadoPor: req.usuario._id,
    createdAt: new Date(),
    updatedAt: null,
  };

  const { insertedId } = await db.collection('prendas').insertOne(nuevaPrenda);
  return res.status(201).json({ _id: insertedId });
}

export default async function (req, res) {
  if (req.method === 'GET') return handlerGet(req, res);
  if (req.method === 'POST') {
    return withGuards(
      [requireTiendaAccess(PERMISOS.PUBLICAR_PRENDAS, obtenerTiendaIdDelBody)],
      handlerPost
    )(req, res);
  }
  return res.status(405).end();
}
