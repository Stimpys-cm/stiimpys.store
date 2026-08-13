/**
 * models/usuario.model.js
 *
 * Definición del esquema de validación de MongoDB ($jsonSchema)
 * para la colección `usuarios`. Se aplica vía scripts/init-db.js
 * usando db.createCollection() o db.command({ collMod }).
 *
 * No usamos Mongoose: seguimos con el driver nativo de `mongodb`
 * que ya tiene el proyecto (lib/db/_db.js), así evitamos una
 * dependencia extra y mantenemos el control total de las queries.
 */

const { ROLES } = require('../lib/rbac/constants');

const usuarioSchema = {
  $jsonSchema: {
    bsonType: 'object',
    title: 'usuario',
    required: ['username', 'email', 'passwordHash', 'role', 'createdAt'],
    properties: {
      _id: { bsonType: 'objectId' },

      username: {
        bsonType: 'string',
        minLength: 3,
        maxLength: 30,
        description: 'Único, usado también en la URL de perfil público',
      },
      email: { bsonType: 'string', pattern: '^.+@.+\\..+$' },
      passwordHash: { bsonType: 'string' },

      avatarUrl: { bsonType: ['string', 'null'] },
      bannerUrl: { bsonType: ['string', 'null'] },
      ubicacion: { bsonType: ['string', 'null'] },
      bio: { bsonType: ['string', 'null'], maxLength: 500 },

      role: {
        bsonType: 'string',
        enum: Object.values(ROLES),
      },

      // Flags granulares otorgados por el SuperAdmin.
      // Ej: { moderarPublicaciones: true, aprobarTiendas: false }
      permisos: {
        bsonType: 'object',
        additionalProperties: { bsonType: 'bool' },
      },

      // IDs de tiendas que este usuario administra (rol admin_tienda,
      // o un moderador con permisos extendidos sobre una tienda puntual)
      tiendasAdmin: {
        bsonType: 'array',
        items: { bsonType: 'objectId' },
      },

      seguidores: {
        bsonType: 'array',
        items: { bsonType: 'objectId' },
      },
      siguiendo: {
        bsonType: 'array',
        items: { bsonType: 'objectId' },
      },

      calificacionPromedio: { bsonType: ['double', 'int', 'null'] },
      totalTransacciones: { bsonType: ['int', 'null'] },

      // Tallas guardadas por el usuario para el filtro "ADD MY SIZES"
      misTallas: {
        bsonType: 'array',
        items: { bsonType: 'string' },
      },

      estado: {
        bsonType: 'string',
        enum: ['activo', 'suspendido', 'baneado'],
      },

      createdAt: { bsonType: 'date' },
      updatedAt: { bsonType: ['date', 'null'] },
    },
  },
};

// Índices recomendados (se crean en scripts/init-db.js)
const usuarioIndexes = [
  { key: { username: 1 }, options: { unique: true } },
  { key: { email: 1 }, options: { unique: true } },
  { key: { role: 1 }, options: {} },
];

module.exports = { usuarioSchema, usuarioIndexes };
