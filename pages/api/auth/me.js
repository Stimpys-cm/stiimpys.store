/**
 * pages/api/auth/me.js
 *
 * Devuelve el usuario de la sesión actual (o 401 si no hay).
 * Lo consume el AuthProvider del cliente al cargar la app.
 */

const { getUsuarioActual } = require('../../../lib/rbac/auth');

export default async function handler(req, res) {
  const usuario = await getUsuarioActual(req);
  if (!usuario) return res.status(401).json({ error: 'No autenticado' });

  return res.status(200).json({
    _id: usuario._id,
    username: usuario.username,
    role: usuario.role,
    permisos: usuario.permisos || {},
    tiendasAdmin: usuario.tiendasAdmin || [],
    avatarUrl: usuario.avatarUrl || null,
    misTallas: usuario.misTallas || [],
  });
}
