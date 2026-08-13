/**
 * models/interacciones.model.js
 *
 * Colecciones pequeñas y de alta escritura, separadas del modelo
 * principal para no inflar `usuarios` ni `prendas`:
 * favoritos, reportes, resenas.
 */

const favoritoSchema = {
  $jsonSchema: {
    bsonType: 'object',
    title: 'favorito',
    required: ['usuarioId', 'prendaId', 'createdAt'],
    properties: {
      _id: { bsonType: 'objectId' },
      usuarioId: { bsonType: 'objectId' },
      prendaId: { bsonType: 'objectId' },
      createdAt: { bsonType: 'date' },
    },
  },
};
const favoritoIndexes = [
  { key: { usuarioId: 1, prendaId: 1 }, options: { unique: true } },
];

const reporteSchema = {
  $jsonSchema: {
    bsonType: 'object',
    title: 'reporte',
    required: ['reportadoPor', 'tipo', 'objetivoId', 'estado', 'createdAt'],
    properties: {
      _id: { bsonType: 'objectId' },
      reportadoPor: { bsonType: 'objectId' },
      tipo: {
        bsonType: 'string',
        enum: ['prenda', 'usuario', 'tienda', 'resena'],
      },
      objetivoId: { bsonType: 'objectId' },
      motivo: { bsonType: ['string', 'null'] },
      estado: {
        bsonType: 'string',
        enum: ['pendiente', 'en_revision', 'resuelto', 'descartado'],
      },
      revisadoPor: { bsonType: ['objectId', 'null'] },
      resolucion: { bsonType: ['string', 'null'] },
      createdAt: { bsonType: 'date' },
      resueltoAt: { bsonType: ['date', 'null'] },
    },
  },
};
const reporteIndexes = [
  { key: { estado: 1 }, options: {} },
  { key: { tipo: 1, objetivoId: 1 }, options: {} },
];

const resenaSchema = {
  $jsonSchema: {
    bsonType: 'object',
    title: 'resena',
    required: ['tiendaId', 'usuarioId', 'calificacion', 'createdAt'],
    properties: {
      _id: { bsonType: 'objectId' },
      tiendaId: { bsonType: 'objectId' },
      usuarioId: { bsonType: 'objectId' }, // quien escribe la reseña
      calificacion: { bsonType: 'int', minimum: 1, maximum: 5 },
      comentario: { bsonType: ['string', 'null'], maxLength: 1000 },
      estado: {
        bsonType: 'string',
        enum: ['visible', 'oculta_por_moderacion'],
      },
      createdAt: { bsonType: 'date' },
    },
  },
};
const resenaIndexes = [
  { key: { tiendaId: 1, createdAt: -1 }, options: {} },
];

module.exports = {
  favoritoSchema,
  favoritoIndexes,
  reporteSchema,
  reporteIndexes,
  resenaSchema,
  resenaIndexes,
};
