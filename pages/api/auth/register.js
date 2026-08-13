/**
 * pages/api/auth/register.js
 *
 * Registro público — SIEMPRE crea usuarios con role: CLIENTE.
 * Nadie se auto-asigna admin_tienda/moderador/superadmin desde acá;
 * esos roles solo los otorga un superadmin vía
 * pages/api/usuarios/roles.js (ver más abajo).
 */

const bcrypt = require('bcryptjs');
const { getDb } = require('../../../lib/db/_db');
const { ROLES, PERMISOS_DEFAULT_POR_ROL } = require('../../../lib/rbac/constants');

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Faltan campos requeridos' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  }

  const db = await getDb();

  const existente = await db
    .collection('usuarios')
    .findOne({ $or: [{ username }, { email }] });
  if (existente) {
    return res.status(409).json({ error: 'Username o email ya registrado' });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const nuevoUsuario = {
    username,
    email,
    passwordHash,
    avatarUrl: null,
    bannerUrl: null,
    ubicacion: null,
    bio: null,
    role: ROLES.CLIENTE,
    permisos: PERMISOS_DEFAULT_POR_ROL[ROLES.CLIENTE],
    tiendasAdmin: [],
    seguidores: [],
    siguiendo: [],
    calificacionPromedio: null,
    totalTransacciones: 0,
    estado: 'activo',
    createdAt: new Date(),
    updatedAt: null,
  };

  const { insertedId } = await db.collection('usuarios').insertOne(nuevoUsuario);

  return res.status(201).json({ _id: insertedId, username, role: ROLES.CLIENTE });
}
