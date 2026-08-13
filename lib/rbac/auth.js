/**
 * lib/rbac/auth.js
 *
 * Se encarga SOLO de identidad: "¿quién está haciendo este request?"
 * No decide permisos — eso es trabajo de guards.js.
 *
 * Compatible con Next.js API routes (req, res) y con Route Handlers
 * (adaptador abajo) para que no tengas que reescribirlo si migras
 * de Pages Router a App Router a mitad de proyecto.
 */

const jwt = require('jsonwebtoken');
const { getDb } = require('../db/_db');
const { ObjectId } = require('mongodb');

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_COOKIE_NAME = 'session_token';

if (!JWT_SECRET) {
  // Falla rápido en build/arranque, no en el primer login de un usuario real.
  throw new Error('Falta la variable de entorno JWT_SECRET');
}

/**
 * Extrae el token de la cookie httpOnly (preferido) o del header
 * Authorization: Bearer <token> (útil para llamadas server-to-server).
 */
function extraerToken(req) {
  const cookieToken = req.cookies?.[TOKEN_COOKIE_NAME];
  if (cookieToken) return cookieToken;

  const authHeader = req.headers?.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice('Bearer '.length);
  }
  return null;
}

/**
 * Resuelve el usuario autenticado a partir del request.
 * Devuelve null si no hay sesión válida (NO lanza error:
 * hay endpoints públicos que quieren saber "¿hay usuario o no?"
 * sin cortar la ejecución, ej. el catálogo público con favoritos
 * marcados si estás logueado).
 */
async function getUsuarioActual(req) {
  const token = extraerToken(req);
  if (!token) return null;

  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return null; // token inválido o expirado
  }

  const db = await getDb();
  const usuario = await db.collection('usuarios').findOne(
    { _id: new ObjectId(payload.sub) },
    {
      projection: {
        passwordHash: 0, // nunca devolver el hash, ni por accidente
      },
    }
  );

  if (!usuario || usuario.estado === 'baneado') return null;

  return usuario;
}

/**
 * Middleware "duro": corta el request con 401 si no hay sesión.
 * Usar en cualquier endpoint que requiera estar logueado,
 * independientemente del rol.
 */
function requireAuth(handler) {
  return async (req, res) => {
    const usuario = await getUsuarioActual(req);
    if (!usuario) {
      return res.status(401).json({ error: 'No autenticado' });
    }
    req.usuario = usuario;
    return handler(req, res);
  };
}

function generarToken(usuario) {
  return jwt.sign({ sub: usuario._id.toString() }, JWT_SECRET, {
    expiresIn: '7d',
  });
}

module.exports = {
  getUsuarioActual,
  requireAuth,
  generarToken,
  TOKEN_COOKIE_NAME,
};
