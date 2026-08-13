/**
 * scripts/seed-superadmin.js
 *
 * Crea el primer usuario SuperAdmin si no existe ninguno.
 * Úsalo cuando arrancas el proyecto desde cero (sin migrar datos
 * viejos). Lee credenciales de las variables SEED_ADMIN_* del .env.
 *
 * Uso: npm run db:seed
 */

require('dotenv').config();
const bcrypt = require('bcryptjs');
const { getDb } = require('../lib/db/_db');
const { ROLES } = require('../lib/rbac/constants');

async function main() {
  const db = await getDb();

  const yaHay = await db.collection('usuarios').findOne({ role: ROLES.SUPERADMIN });
  if (yaHay) {
    console.log(`ℹ️  Ya existe un superadmin (${yaHay.username}). No se crea otro.`);
    process.exit(0);
  }

  const username = process.env.SEED_ADMIN_USER || 'admin';
  const email = process.env.SEED_ADMIN_EMAIL || 'admin@stiimpys.store';
  const password = process.env.SEED_ADMIN_PASSWORD;

  if (!password) {
    console.error('❌ Falta SEED_ADMIN_PASSWORD en el .env');
    process.exit(1);
  }

  await db.collection('usuarios').insertOne({
    username,
    email,
    passwordHash: await bcrypt.hash(password, 12),
    avatarUrl: null,
    bannerUrl: null,
    ubicacion: null,
    bio: null,
    role: ROLES.SUPERADMIN,
    permisos: {},
    tiendasAdmin: [],
    seguidores: [],
    siguiendo: [],
    calificacionPromedio: null,
    totalTransacciones: 0,
    estado: 'activo',
    createdAt: new Date(),
    updatedAt: null,
  });

  console.log(`✅ SuperAdmin creado: ${username} / (la password que pusiste en .env)`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error en seed:', err);
  process.exit(1);
});
