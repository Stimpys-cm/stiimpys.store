/**
 * lib/rbac/constants.js
 *
 * Única fuente de verdad para roles y permisos del marketplace.
 * Cualquier nuevo permiso se agrega SOLO aquí, nunca hardcodeado
 * en un endpoint o componente.
 */

const ROLES = Object.freeze({
  CLIENTE: 'cliente',
  MODERADOR: 'moderador',
  ADMIN_TIENDA: 'admin_tienda',
  SUPERADMIN: 'superadmin',
});

/**
 * Catálogo de permisos granulares que el SuperAdmin puede otorgar
 * a un Moderador o a un Admin de Tienda. Se guardan como flags
 * booleanos dentro de usuario.permisos.
 */
const PERMISOS = Object.freeze({
  // --- Moderación ---
  MODERAR_PUBLICACIONES: 'moderarPublicaciones',
  APROBAR_TIENDAS: 'aprobarTiendas',
  BANEAR_USUARIOS: 'banearUsuarios',
  MODERAR_RESENAS: 'moderarResenas',
  RESOLVER_REPORTES: 'resolverReportes',

  // --- Gestión de tienda ---
  PUBLICAR_PRENDAS: 'publicarPrendas',
  EDITAR_PRENDAS: 'editarPrendas',
  ELIMINAR_PRENDAS: 'eliminarPrendas',
  EDITAR_CATALOGO: 'editarCatalogo', // categorías/marcas
  VER_COSTO_INTERNO: 'verCostoInterno',
  VER_GANANCIAS: 'verGanancias',

  // --- Administración global (normalmente solo superadmin) ---
  GESTIONAR_ROLES: 'gestionarRoles',
  GESTIONAR_PERMISOS: 'gestionarPermisos',
});

/**
 * Permisos por defecto al crear un usuario con cada rol.
 * El SuperAdmin puede modificar esto por-usuario después;
 * esto es solo el punto de partida.
 */
const PERMISOS_DEFAULT_POR_ROL = Object.freeze({
  [ROLES.CLIENTE]: {},

  [ROLES.MODERADOR]: {
    [PERMISOS.MODERAR_PUBLICACIONES]: true,
    [PERMISOS.APROBAR_TIENDAS]: false, // se otorga explícitamente
    [PERMISOS.BANEAR_USUARIOS]: false,
    [PERMISOS.MODERAR_RESENAS]: true,
    [PERMISOS.RESOLVER_REPORTES]: true,
  },

  [ROLES.ADMIN_TIENDA]: {
    [PERMISOS.PUBLICAR_PRENDAS]: true,
    [PERMISOS.EDITAR_PRENDAS]: true,
    [PERMISOS.ELIMINAR_PRENDAS]: true,
    [PERMISOS.EDITAR_CATALOGO]: true,
    [PERMISOS.VER_COSTO_INTERNO]: true,
    [PERMISOS.VER_GANANCIAS]: true,
  },

  // SuperAdmin no usa flags: tiene bypass total (ver lib/rbac/guards.js)
  [ROLES.SUPERADMIN]: {},
});

const ESTADOS_TIENDA = Object.freeze({
  PENDIENTE: 'pendiente',
  APROBADA: 'aprobada',
  SUSPENDIDA: 'suspendida',
  RECHAZADA: 'rechazada',
});

const ESTADOS_PRENDA = Object.freeze({
  DISPONIBLE: 'disponible',
  RESERVADO: 'reservado',
  VENDIDO: 'vendido',
});

module.exports = {
  ROLES,
  PERMISOS,
  PERMISOS_DEFAULT_POR_ROL,
  ESTADOS_TIENDA,
  ESTADOS_PRENDA,
};
