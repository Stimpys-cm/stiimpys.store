/**
 * models/prenda.model.js
 *
 * Colección `prendas`. Cada prenda pertenece a exactamente una tienda
 * (tiendaId). Los filtros del catálogo (Grailed-style) se construyen
 * sobre estos campos, así que los índices importan tanto como el
 * esquema.
 */

const { ESTADOS_PRENDA } = require('../lib/rbac/constants');

const prendaSchema = {
  $jsonSchema: {
    bsonType: 'object',
    title: 'prenda',
    required: [
      'tiendaId',
      'titulo',
      'precio',
      'estado',
      'publicadoPor',
      'createdAt',
    ],
    properties: {
      _id: { bsonType: 'objectId' },

      tiendaId: { bsonType: 'objectId' },

      titulo: { bsonType: 'string', minLength: 2, maxLength: 100 },
      descripcion: { bsonType: ['string', 'null'], maxLength: 2000 },

      marca: { bsonType: ['string', 'null'] },
      departamento: {
        bsonType: ['string', 'null'],
        enum: ['menswear', 'womenswear', 'unisex', null],
      },
      categoria: { bsonType: ['string', 'null'] }, // ej. "Jackets", "Denim"
      talla: { bsonType: ['string', 'null'] },
      color: { bsonType: ['string', 'null'] },

      precio: { bsonType: ['double', 'int'], minimum: 0 },
      costoInterno: {
        bsonType: ['double', 'int', 'null'],
        description: 'Visible solo con permiso VER_COSTO_INTERNO',
      },

      condicion: {
        bsonType: ['string', 'null'],
        enum: [
          'nuevo_con_etiqueta',
          'como_nuevo',
          'buen_estado',
          'usado',
          null,
        ],
      },

      fotos: {
        bsonType: 'array',
        items: { bsonType: 'string' },
        maxItems: 6,
      },

      estado: {
        bsonType: 'string',
        enum: Object.values(ESTADOS_PRENDA),
      },

      publicadoPor: { bsonType: 'objectId' }, // usuario que la creó

      createdAt: { bsonType: 'date' },
      updatedAt: { bsonType: ['date', 'null'] },
    },
  },
};

// Estos índices son los que sostienen el sidebar de filtros
// (Department/Category/Size/Brand/Color/Price) sin table scans.
const prendaIndexes = [
  { key: { tiendaId: 1, estado: 1 }, options: {} },
  { key: { departamento: 1, categoria: 1 }, options: {} },
  { key: { marca: 1 }, options: {} },
  { key: { talla: 1 }, options: {} },
  { key: { precio: 1 }, options: {} },
  { key: { createdAt: -1 }, options: {} },
  {
    key: { titulo: 'text', marca: 'text', descripcion: 'text' },
    options: { name: 'prenda_text_search' },
  },
];

module.exports = { prendaSchema, prendaIndexes };
