/**
 * pages/api/usuarios/[id].js
 *
 * GET  -> perfil público (para /perfil/[username] estilo Grailed)
 * PUT  -> editar el propio perfil (o superadmin editando a cualquiera)
 */

const { ObjectId } = require('mongodb');
const { getDb } = require('../../../lib/db/_db');
const { requireAuth } = require('../../../lib/rbac/auth');
const { esSuperAdmin } = require('../../../lib/rbac/guards');

const CAMPOS_PUBLICOS = {
  passwordHash: 0,
  email: 0,
  permisos: 0,
  tiendasAdmin: 0,
};

async function handler(req, res) {
  const db = await getDb();
  const _id = new ObjectId(req.query.id);

  if (req.method === 'GET') {
    const usuario = await db
      .collection('usuarios')
      .findOne({ _id }, { projection: CAMPOS_PUBLICOS });
    if (!usuario) return res.status(404).json({ error: 'Usuario no encontrado' });
    return res.status(200).json(usuario);
  }

  if (req.method === 'PUT') {
    const esDueño = req.usuario._id.equals(_id);
    if (!esDueño && !esSuperAdmin(req.usuario)) {
      return res.status(403).json({ error: 'No puedes editar este perfil' });
    }

    // Whitelist explícita: nunca aceptar role/permisos/tiendasAdmin
    // desde este endpoint, eso solo se cambia vía roles.js/permisos.js
    const { avatarUrl, bannerUrl, ubicacion, bio, misTallas } = req.body;
    const cambios = { updatedAt: new Date() };
    if (avatarUrl !== undefined) cambios.avatarUrl = avatarUrl;
    if (bannerUrl !== undefined) cambios.bannerUrl = bannerUrl;
    if (ubicacion !== undefined) cambios.ubicacion = ubicacion;
    if (bio !== undefined) cambios.bio = bio;
    if (Array.isArray(misTallas)) cambios.misTallas = misTallas;

    await db.collection('usuarios').updateOne({ _id }, { $set: cambios });
    return res.status(200).json({ ok: true });
  }

  return res.status(405).end();
}

// GET es público (sin requireAuth) para poder ver perfiles sin sesión;
// PUT sí exige auth, validado adentro del handler.
export default async function (req, res) {
  if (req.method === 'GET') return handler(req, res);
  return requireAuth(handler)(req, res);
}
