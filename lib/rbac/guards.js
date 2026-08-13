/**
 * lib/rbac/guards.js
 *
 * "Qué puede hacer" el usuario ya identificado por auth.js.
 * Regla de diseño: estos guards son la ÚNICA fuente de verdad de
 * autorización. El frontend puede (y debe) esconder botones según
 * el rol/permisos para UX, pero eso NUNCA reemplaza esta capa.
 * Todo endpoint de escritura debe pasar por al menos uno de estos.
 */

const { ObjectId } = require('mongodb');
const { getDb } = require('../db/_db');
const { ROLES } = require('./constants');
const { requireAuth } = require('./auth');

/**
 * El SuperAdmin siempre pasa cualquier guard. Se centraliza acá
 * para no repetir "if (usuario.role === SUPERADMIN)" en cada guard.
 */
function esSuperAdmin(usuario) {
  return usuario.role === ROLES.SUPERADMIN;
}

/**
 * Exige uno de los roles indicados. Ej:
 *   export default requireAuth(requireRole(ROLES.MODERADOR, ROLES.SUPERADMIN)(handler))
 */
function requireRole(...rolesPermitidos) {
  return (handler) => async (req, res) => {
    const usuario = req.usuario; // ya adjuntado por requireAuth
    if (esSuperAdmin(usuario) || rolesPermitidos.includes(usuario.role)) {
      return handler(req, res);
    }
    return res.status(403).json({ error: 'Rol insuficiente para esta acción' });
  };
}

/**
 * Exige un permiso granular específico (usuario.permisos[permiso] === true).
 * Ej: requirePermiso(PERMISOS.APROBAR_TIENDAS)
 */
function requirePermiso(permiso) {
  return (handler) => async (req, res) => {
    const usuario = req.usuario;
    if (esSuperAdmin(usuario) || usuario.permisos?.[permiso] === true) {
      return handler(req, res);
    }
    return res
      .status(403)
      .json({ error: `Falta el permiso requerido: ${permiso}` });
  };
}

/**
 * Guard específico para acciones sobre UNA tienda puntual
 * (ej. editar una prenda de tiendaId=X). Permite el acceso si:
 *   1. Es SuperAdmin, o
 *   2. Es el owner de esa tienda, o
 *   3. Es colaborador de esa tienda con el permiso pedido, o
 *   4. Es moderador global con el permiso pedido (ej. moderarPublicaciones)
 *
 * `obtenerTiendaId` es una función (req) => tiendaId, porque el
 * tiendaId puede venir del body, de la query o de la prenda referenciada
 * — cada endpoint sabe cómo resolverlo, este guard solo lo consume.
 */
function requireTiendaAccess(permiso, obtenerTiendaId) {
  return (handler) => async (req, res) => {
    const usuario = req.usuario;

    if (esSuperAdmin(usuario)) return handler(req, res);

    const tiendaId = await obtenerTiendaId(req);
    if (!tiendaId) {
      return res.status(400).json({ error: 'No se pudo resolver la tienda objetivo' });
    }

    // Moderador global con el permiso otorgado
    if (usuario.permisos?.[permiso] === true) {
      return handler(req, res);
    }

    const db = await getDb();
    const tienda = await db.collection('tiendas').findOne({
      _id: new ObjectId(tiendaId),
    });

    if (!tienda) {
      return res.status(404).json({ error: 'Tienda no encontrada' });
    }

    const esOwner = tienda.ownerId.equals(usuario._id);
    const colaborador = tienda.colaboradores?.find((c) =>
      c.usuarioId.equals(usuario._id)
    );
    const esColaboradorConPermiso = colaborador?.permisos?.[permiso] === true;

    if (esOwner || esColaboradorConPermiso) {
      req.tienda = tienda; // se lo dejamos listo al handler, evita otra query
      return handler(req, res);
    }

    return res.status(403).json({ error: 'Sin acceso a esta tienda' });
  };
}

/**
 * Compone requireAuth + los guards de rol/permiso en un solo helper
 * para que los endpoints queden legibles en una línea. Ej:
 *
 *   export default withGuards(
 *     [requireRole(ROLES.SUPERADMIN)],
 *     handler
 *   );
 */
function withGuards(guards, handler) {
  const composed = guards.reduceRight((acc, guard) => guard(acc), handler);
  return requireAuth(composed);
}

module.exports = {
  requireRole,
  requirePermiso,
  requireTiendaAccess,
  withGuards,
  esSuperAdmin,
};
