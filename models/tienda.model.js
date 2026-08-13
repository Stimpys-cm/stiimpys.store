/**
 * models/tienda.model.js
 *
 * Colección `tiendas`. Cada documento es una tienda independiente
 * dentro del marketplace (lo que antes era "el bazar" único).
 */

const { ESTADOS_TIENDA } = require('../lib/rbac/constants');

const tiendaSchema = {
  $jsonSchema: {
    bsonType: 'object',
    title: 'tienda',
    required: ['slug', 'nombre', 'ownerId', 'estado', 'createdAt'],
    properties: {
      _id: { bsonType: 'objectId' },

      slug: {
        bsonType: 'string',
        description: 'Usado en /tienda/:slug, único',
      },
      nombre: { bsonType: 'string', minLength: 2, maxLength: 60 },
      descripcion: { bsonType: ['string', 'null'], maxLength: 1000 },

      logoUrl: { bsonType: ['string', 'null'] },
      bannerUrl: { bsonType: ['string', 'null'] },

      ownerId: {
        bsonType: 'objectId',
        description: 'usuario que creó la tienda (admin_tienda principal)',
      },

      // Otros usuarios con acceso de administración a esta tienda
      // específica, además del ownerId. Útil si un owner quiere
      // dar acceso a un colaborador sin hacerlo dueño.
      colaboradores: {
        bsonType: 'array',
        items: {
          bsonType: 'object',
          required: ['usuarioId', 'permisos'],
          properties: {
            usuarioId: { bsonType: 'objectId' },
            permisos: {
              bsonType: 'object',
              additionalProperties: { bsonType: 'bool' },
            },
          },
        },
      },

      estado: {
        bsonType: 'string',
        enum: Object.values(ESTADOS_TIENDA),
      },
      revisadoPor: { bsonType: ['objectId', 'null'] }, // moderador que aprobó/rechazó
      motivoRechazo: { bsonType: ['string', 'null'] },

      ubicacion: { bsonType: ['string', 'null'] },
      redesSociales: {
        bsonType: ['object', 'null'],
        additionalProperties: { bsonType: 'string' },
      },
      whatsapp: { bsonType: ['string', 'null'] },

      calificacionPromedio: { bsonType: ['double', 'int', 'null'] },
      totalVentas: { bsonType: ['int', 'null'] },

      createdAt: { bsonType: 'date' },
      updatedAt: { bsonType: ['date', 'null'] },
    },
  },
};

const tiendaIndexes = [
  { key: { slug: 1 }, options: { unique: true } },
  { key: { ownerId: 1 }, options: {} },
  { key: { estado: 1 }, options: {} },
];

module.exports = { tiendaSchema, tiendaIndexes };
