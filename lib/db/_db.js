/**
 * lib/db/_db.js
 *
 * Conexión compartida a MongoDB. En serverless (Vercel) cada
 * invocación puede reusar el contenedor, así que cacheamos la
 * conexión en una variable global para no abrir un socket nuevo
 * en cada request (esto ya lo tenías en api/_db.js, se mantiene
 * el mismo patrón, solo se mueve a lib/db para que tanto las
 * API routes como los scripts de migración lo compartan).
 */

const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'tienda_marketplace';

if (!uri) {
  throw new Error('Falta la variable de entorno MONGODB_URI');
}

let cachedClient = global._mongoClient;
let cachedDb = global._mongoDb;

async function getDb() {
  if (cachedDb) return cachedDb;

  const client = cachedClient || new MongoClient(uri, {
    maxPoolSize: 10,
  });

  if (!cachedClient) {
    await client.connect();
    cachedClient = client;
    global._mongoClient = client;
  }

  cachedDb = client.db(dbName);
  global._mongoDb = cachedDb;
  return cachedDb;
}

module.exports = { getDb };
