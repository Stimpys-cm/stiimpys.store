/**
 * scripts/init-db.js
 *
 * Crea (o actualiza) las colecciones con sus validadores $jsonSchema
 * y aplica los índices definidos en cada modelo.
 *
 * Uso:
 *   node scripts/init-db.js
 *
 * Es idempotente: se puede correr varias veces sin duplicar nada.
 * Córrelo ANTES del script de migración.
 */

require('dotenv').config();
const { getDb } = require('../lib/db/_db');

const { usuarioSchema, usuarioIndexes } = require('../models/usuario.model');
const { tiendaSchema, tiendaIndexes } = require('../models/tienda.model');
const { prendaSchema, prendaIndexes } = require('../models/prenda.model');
const {
  favoritoSchema,
  favoritoIndexes,
  reporteSchema,
  reporteIndexes,
  resenaSchema,
  resenaIndexes,
  compraSchema,
  compraIndexes,
} = require('../models/interacciones.model');

const COLECCIONES = [
  { nombre: 'usuarios', schema: usuarioSchema, indexes: usuarioIndexes },
  { nombre: 'tiendas', schema: tiendaSchema, indexes: tiendaIndexes },
  { nombre: 'prendas', schema: prendaSchema, indexes: prendaIndexes },
  { nombre: 'favoritos', schema: favoritoSchema, indexes: favoritoIndexes },
  { nombre: 'reportes', schema: reporteSchema, indexes: reporteIndexes },
  { nombre: 'resenas', schema: resenaSchema, indexes: resenaIndexes },
  { nombre: 'compras', schema: compraSchema, indexes: compraIndexes },
];

async function crearOActualizarColeccion(db, { nombre, schema, indexes }) {
  const existentes = await db
    .listCollections({ name: nombre })
    .toArray();

  if (existentes.length === 0) {
    await db.createCollection(nombre, { validator: schema });
    console.log(`✅ Colección creada: ${nombre}`);
  } else {
    await db.command({
      collMod: nombre,
      validator: schema,
      validationLevel: 'moderate', // no rompe documentos viejos durante migración
    });
    console.log(`♻️  Validador actualizado: ${nombre}`);
  }

  for (const { key, options } of indexes) {
    await db.collection(nombre).createIndex(key, options);
  }
  console.log(`   ↳ ${indexes.length} índice(s) aplicado(s)`);
}

async function main() {
  const db = await getDb();

  for (const coleccion of COLECCIONES) {
    await crearOActualizarColeccion(db, coleccion);
  }

  console.log('\n🎉 init-db.js completado');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error en init-db.js:', err);
  process.exit(1);
});
