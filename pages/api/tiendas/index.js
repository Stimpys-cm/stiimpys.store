/**
 * pages/api/tiendas/index.js
 *
 * GET  -> lista tiendas aprobadas (para el grid de "tiendas destacadas")
 * POST -> cualquier usuario logueado puede solicitar crear una tienda;
 *         nace en estado "pendiente" hasta que un moderador la apruebe.
 */

const { getDb } = require('../../../lib/db/_db');
const { requireAuth, getUsuarioActual } = require('../../../lib/rbac/auth');
const {
  ESTADOS_TIENDA,
  ROLES,
  PERMISOS,
  PERMISOS_DEFAULT_POR_ROL,
} = require('../../../lib/rbac/constants');

function puedeVerPendientes(usuario) {
  if (!usuario) return false;
  return usuario.role === ROLES.SUPERADMIN || usuario.permisos?.[PERMISOS.APROBAR_TIENDAS] === true;
}

function slugify(texto) {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function handlerGet(req, res) {
  const db = await getDb();
  const { limit = 20, skip = 0, estado } = req.query;

  // Listar pendientes/rechazadas requiere permiso; por defecto solo aprobadas.
  let filtroEstado = ESTADOS_TIENDA.APROBADA;
  if (estado && estado !== ESTADOS_TIENDA.APROBADA) {
    const usuario = await getUsuarioActual(req);
    if (!puedeVerPendientes(usuario)) {
      return res.status(403).json({ error: 'Sin permiso para ver tiendas en ese estado' });
    }
    filtroEstado = estado;
  }

  const tiendas = await db
    .collection('tiendas')
    .find({ estado: filtroEstado })
    .sort({ createdAt: -1 })
    .skip(Number(skip))
    .limit(Math.min(Number(limit), 50))
    .toArray();

  return res.status(200).json(tiendas);
}

async function handlerPost(req, res) {
  const { nombre, descripcion } = req.body;
  if (!nombre) return res.status(400).json({ error: 'Falta el nombre de la tienda' });

  const db = await getDb();
  let slugBase = slugify(nombre);
  let slug = slugBase;
  let sufijo = 1;

  // Garantiza slug único sin fallar por colisión
  while (await db.collection('tiendas').findOne({ slug })) {
    slug = `${slugBase}-${++sufijo}`;
  }

  const nuevaTienda = {
    slug,
    nombre,
    descripcion: descripcion || null,
    logoUrl: null,
    bannerUrl: null,
    ownerId: req.usuario._id,
    colaboradores: [],
    estado: ESTADOS_TIENDA.PENDIENTE,
    revisadoPor: null,
    motivoRechazo: null,
    ubicacion: null,
    redesSociales: null,
    whatsapp: null,
    calificacionPromedio: null,
    totalVentas: null,
    createdAt: new Date(),
    updatedAt: null,
  };

  const { insertedId } = await db.collection('tiendas').insertOne(nuevaTienda);

  // El creador pasa a admin_tienda si aún era cliente
  if (req.usuario.role === ROLES.CLIENTE) {
    await db.collection('usuarios').updateOne(
      { _id: req.usuario._id },
      {
        $set: {
          role: ROLES.ADMIN_TIENDA,
          permisos: PERMISOS_DEFAULT_POR_ROL[ROLES.ADMIN_TIENDA],
        },
        $addToSet: { tiendasAdmin: insertedId },
      }
    );
  } else {
    await db.collection('usuarios').updateOne(
      { _id: req.usuario._id },
      { $addToSet: { tiendasAdmin: insertedId } }
    );
  }

  return res.status(201).json({ _id: insertedId, slug, estado: ESTADOS_TIENDA.PENDIENTE });
}

export default async function (req, res) {
  if (req.method === 'GET') return handlerGet(req, res);
  if (req.method === 'POST') return requireAuth(handlerPost)(req, res);
  return res.status(405).end();
}
