/**
 * scripts/migrar-a-multitienda.js
 *
 * Migra los datos de tu sistema actual (un solo bazar) al nuevo
 * modelo multi-tienda:
 *
 *   1. Crea la primera `tienda` a partir de tus datos actuales
 *      (nombre, config, etc.) con estado "aprobada".
 *   2. Toma tu usuario admin actual y lo vuelve `superadmin`.
 *   3. Toma tus usuarios vendedores y los vuelve `admin_tienda`,
 *      agregándolos como colaboradores de la tienda migrada.
 *   4. Agrega `tiendaId` a todas las prendas existentes.
 *
 * ⚠️ AJUSTA los nombres de colección/campos de las líneas marcadas
 * con "// ADAPTAR" según cómo se llamen exactamente en tu colección
 * `inventario`/`usuarios`/`config` actual — no tengo el contenido
 * real de tu DB, solo la estructura del repo, así que estos son los
 * nombres más probables según tu README (inventario.js, config.js,
 * auth.js).
 *
 * Uso:
 *   node scripts/migrar-a-multitienda.js --dry-run   (solo muestra qué haría)
 *   node scripts/migrar-a-multitienda.js             (ejecuta de verdad)
 *
 * Es seguro correrlo dos veces: revisa `migrado: true` antes de tocar
 * cada documento.
 */

require('dotenv').config();
const { ObjectId } = require('mongodb');
const { getDb } = require('../lib/db/_db');
const { ROLES, ESTADOS_TIENDA, PERMISOS_DEFAULT_POR_ROL } = require('../lib/rbac/constants');

const DRY_RUN = process.argv.includes('--dry-run');

async function main() {
  const db = await getDb();
  const log = (...args) => console.log(...args);

  log(DRY_RUN ? '🔍 DRY RUN — no se escribirá nada\n' : '🚀 Migrando de verdad\n');

  // ---------------------------------------------------------------
  // 1. Crear la tienda inicial a partir del bazar actual
  // ---------------------------------------------------------------
  const yaExisteTienda = await db.collection('tiendas').findOne({
    slug: 'stiimpys-store', // ADAPTAR: el slug que quieras para tu tienda original
  });

  let tiendaId;

  if (yaExisteTienda) {
    tiendaId = yaExisteTienda._id;
    log(`↩️  Tienda ya migrada previamente (_id: ${tiendaId})`);
  } else {
    // ADAPTAR: aquí deberías leer tu doc de `config` actual si tiene
    // nombre/descr del bazar. Si no existe, se usan estos defaults.
    const configActual = await db.collection('config').findOne({}); // ADAPTAR

    const nuevaTienda = {
      slug: 'stiimpys-store',
      nombre: configActual?.nombreTienda || 'Stiimpys Store',
      descripcion: configActual?.descripcion || null,
      logoUrl: null,
      bannerUrl: null,
      ownerId: null, // se completa en el paso 2, una vez identificado el admin
      colaboradores: [],
      estado: ESTADOS_TIENDA.APROBADA,
      revisadoPor: null,
      motivoRechazo: null,
      ubicacion: null,
      redesSociales: null,
      whatsapp: configActual?.whatsapp || null,
      calificacionPromedio: null,
      totalVentas: null,
      createdAt: new Date(),
      updatedAt: null,
    };

    if (!DRY_RUN) {
      const { insertedId } = await db.collection('tiendas').insertOne(nuevaTienda);
      tiendaId = insertedId;
    } else {
      tiendaId = new ObjectId(); // solo para el resto del dry-run
    }
    log(`✅ Tienda inicial creada (_id: ${tiendaId})`);
  }

  // ---------------------------------------------------------------
  // 2. Migrar usuarios: admin -> superadmin, vendedor -> admin_tienda
  // ---------------------------------------------------------------
  const usuariosActuales = await db
    .collection('usuarios')
    .find({ migrado: { $ne: true } })
    .toArray();

  log(`\n👥 ${usuariosActuales.length} usuario(s) por migrar`);

  let ownerIdEncontrado = null;
  const colaboradores = [];

  for (const u of usuariosActuales) {
    // ADAPTAR: el campo que en tu sistema actual distingue admin de
    // vendedor. Según tu README, probablemente sea `rol` o `tipo`.
    const rolAntiguo = u.rol || u.tipo; // ADAPTAR

    const esAdminAntiguo = rolAntiguo === 'admin';
    const nuevoRol = esAdminAntiguo ? ROLES.SUPERADMIN : ROLES.ADMIN_TIENDA;

    const update = {
      role: nuevoRol,
      permisos: PERMISOS_DEFAULT_POR_ROL[nuevoRol] || {},
      tiendasAdmin: esAdminAntiguo ? [] : [tiendaId],
      seguidores: [],
      siguiendo: [],
      estado: 'activo',
      migrado: true,
      updatedAt: new Date(),
    };

    log(
      `   - ${u.username || u._id}: ${rolAntiguo || '(sin rol)'} → ${nuevoRol}`
    );

    if (esAdminAntiguo && !ownerIdEncontrado) {
      ownerIdEncontrado = u._id;
    }
    if (!esAdminAntiguo) {
      colaboradores.push({
        usuarioId: u._id,
        permisos: PERMISOS_DEFAULT_POR_ROL[ROLES.ADMIN_TIENDA],
      });
    }

    if (!DRY_RUN) {
      await db.collection('usuarios').updateOne({ _id: u._id }, { $set: update });
    }
  }

  // Completar ownerId y colaboradores en la tienda
  if (!DRY_RUN && (ownerIdEncontrado || colaboradores.length)) {
    await db.collection('tiendas').updateOne(
      { _id: tiendaId },
      {
        $set: {
          ownerId: ownerIdEncontrado || colaboradores[0]?.usuarioId,
          colaboradores,
        },
      }
    );
    log(`\n🔗 Tienda vinculada a owner/colaboradores`);
  }

  // ---------------------------------------------------------------
  // 3. Agregar tiendaId a todas las prendas existentes
  //    (ADAPTAR: tu colección actual probablemente se llama
  //    "inventario", no "prendas" — ajusta el nombre de abajo)
  // ---------------------------------------------------------------
  const coleccionPrendasVieja = 'inventario'; // ADAPTAR

  const resultado = DRY_RUN
    ? { matchedCount: await db.collection(coleccionPrendasVieja).countDocuments({ tiendaId: { $exists: false } }) }
    : await db
        .collection(coleccionPrendasVieja)
        .updateMany(
          { tiendaId: { $exists: false } },
          { $set: { tiendaId, updatedAt: new Date() } }
        );

  log(`\n👕 ${resultado.matchedCount} prenda(s) migradas con tiendaId`);

  if (!DRY_RUN && coleccionPrendasVieja !== 'prendas') {
    log(
      `\n⚠️  Nota: tus prendas siguen en la colección "${coleccionPrendasVieja}".` +
        ` Si quieres renombrarla a "prendas" para que coincida con el nuevo` +
        ` esquema, corre: db.${coleccionPrendasVieja}.renameCollection("prendas")` +
        ` en el shell de Mongo DESPUÉS de validar que todo quedó bien.`
    );
  }

  log('\n🎉 Migración completada' + (DRY_RUN ? ' (dry-run, nada se escribió)' : ''));
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error en la migración:', err);
  process.exit(1);
});
