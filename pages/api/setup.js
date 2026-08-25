/**
 * pages/api/setup.js
 *
 * Setup de un solo uso, ejecutable desde el navegador (para quienes
 * despliegan en Vercel sin correr scripts locales).
 *
 * Uso:
 *   /api/setup?key=TU_SETUP_KEY
 *
 * Requiere la variable de entorno SETUP_KEY. Si no está definida,
 * el endpoint responde 404 (queda deshabilitado). Crea colecciones,
 * índices y el superadmin (con las SEED_ADMIN_* del entorno).
 *
 * ⚠️ Después de usarlo, puedes borrar SETUP_KEY del entorno para
 * dejarlo inaccesible.
 */

const bcrypt = require('bcryptjs');
const { getDb } = require('../../lib/db/_db');
const { ROLES } = require('../../lib/rbac/constants');

const { usuarioSchema, usuarioIndexes } = require('../../models/usuario.model');
const { tiendaSchema, tiendaIndexes } = require('../../models/tienda.model');
const { prendaSchema, prendaIndexes } = require('../../models/prenda.model');
const {
  favoritoSchema, favoritoIndexes,
  reporteSchema, reporteIndexes,
  resenaSchema, resenaIndexes,
  compraSchema, compraIndexes,
} = require('../../models/interacciones.model');

const COLECCIONES = [
  { nombre: 'usuarios', schema: usuarioSchema, indexes: usuarioIndexes },
  { nombre: 'tiendas', schema: tiendaSchema, indexes: tiendaIndexes },
  { nombre: 'prendas', schema: prendaSchema, indexes: prendaIndexes },
  { nombre: 'favoritos', schema: favoritoSchema, indexes: favoritoIndexes },
  { nombre: 'reportes', schema: reporteSchema, indexes: reporteIndexes },
  { nombre: 'resenas', schema: resenaSchema, indexes: resenaIndexes },
  { nombre: 'compras', schema: compraSchema, indexes: compraIndexes },
];

export default async function handler(req, res) {
  // Deshabilitado si no hay SETUP_KEY configurada
  if (!process.env.SETUP_KEY) {
    return res.status(404).json({ error: 'Setup no disponible' });
  }
  if (req.query.key !== process.env.SETUP_KEY) {
    return res.status(401).json({ error: 'Clave inválida' });
  }

  const log = [];
  try {
    const db = await getDb();

    // 1. Colecciones + validadores + índices
    for (const { nombre, schema, indexes } of COLECCIONES) {
      const existe = (await db.listCollections({ name: nombre }).toArray()).length > 0;
      if (!existe) {
        await db.createCollection(nombre, { validator: schema });
        log.push(`Colección creada: ${nombre}`);
      } else {
        await db.command({ collMod: nombre, validator: schema, validationLevel: 'moderate' });
        log.push(`Validador actualizado: ${nombre}`);
      }
      for (const { key, options } of indexes) {
        await db.collection(nombre).createIndex(key, options || {});
      }
    }

    // 2. SuperAdmin (si no existe ninguno)
    const yaHay = await db.collection('usuarios').findOne({ role: ROLES.SUPERADMIN });
    if (yaHay) {
      log.push(`SuperAdmin ya existe: ${yaHay.username}`);
    } else if (process.env.SEED_ADMIN_PASSWORD) {
      await db.collection('usuarios').insertOne({
        username: process.env.SEED_ADMIN_USER || 'admin',
        email: process.env.SEED_ADMIN_EMAIL || 'admin@stiimpys.store',
        passwordHash: await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD, 12),
        avatarUrl: null, bannerUrl: null, ubicacion: null, bio: null,
        role: ROLES.SUPERADMIN, permisos: {}, tiendasAdmin: [],
        seguidores: [], siguiendo: [], misTallas: [],
        calificacionPromedio: null, totalTransacciones: 0,
        estado: 'activo', createdAt: new Date(), updatedAt: null,
      });
      log.push(`SuperAdmin creado: ${process.env.SEED_ADMIN_USER || 'admin'}`);
    } else {
      log.push('No se creó superadmin: falta SEED_ADMIN_PASSWORD');
    }

    return res.status(200).json({ ok: true, pasos: log });
  } catch (err) {
    return res.status(500).json({ error: err.message, pasosCompletados: log });
  }
}
