# 🏬 stiimpys.store — Marketplace multi-tienda

Marketplace de tiendas independientes de ropa vintage & streetwear, inspirado en la UX de Grailed. Migración del proyecto original (Catalogodeunbazar) de HTML/JS vanilla a **Next.js**, conservando la misma estética (Bebas Neue + DM Sans, crema/navy/azul) y agregando arquitectura multi-tienda con control de roles y permisos granular (RBAC).

> **Nomenclatura:** por decisión de marca, en todo el código se usa `tienda` (no "bazar") — colecciones, rutas, campos y componentes.

---

## 🧱 Stack

| Capa | Tecnología |
|------|-----------|
| Framework | Next.js 14 (Pages Router) |
| Base de datos | MongoDB (driver nativo, sin Mongoose) |
| Auth | JWT en cookie httpOnly + bcrypt |
| Imágenes | Cloudinary |
| Hosting | Vercel |

---

## 📁 Estructura

```
stiimpys-store/
├── lib/
│   ├── db/_db.js              # Conexión compartida a MongoDB (cacheada)
│   ├── rbac/constants.js      # ⭐ Única fuente de verdad: roles y permisos
│   ├── rbac/auth.js           # Identidad: quién eres (JWT)
│   ├── rbac/guards.js         # Autorización: qué puedes hacer
│   └── useAuth.js             # Contexto de sesión del cliente
├── models/                    # Esquemas $jsonSchema + índices
│   ├── usuario.model.js
│   ├── tienda.model.js
│   ├── prenda.model.js
│   └── interacciones.model.js # favoritos, reportes, resenas
├── pages/
│   ├── index.js               # Landing (hero, tiendas, reseñas)
│   ├── catalogo.js            # Explorar con filtros laterales
│   ├── login.js               # Ingreso / registro
│   ├── tienda/[slug].js       # Perfil público de tienda (tabs Grailed)
│   ├── prenda/[id].js         # Detalle de prenda + WhatsApp
│   ├── perfil/[username].js   # Perfil de usuario
│   ├── admin/dashboard.js     # Entrada al panel según rol
│   ├── admin/[tiendaId].js    # Panel de inventario por tienda
│   ├── admin/nueva-tienda.js  # Solicitar tienda (queda pendiente)
│   ├── admin/users.js         # ⭐ SuperAdmin: roles y permisos
│   ├── admin/moderation.js    # Moderación: aprobar tiendas, reportes
│   └── api/                   # Endpoints (ver abajo)
├── components/                # Header, ProductCard, FilterSidebar
├── scripts/
│   ├── init-db.js             # Crea colecciones + validadores + índices
│   ├── seed-superadmin.js     # Crea el primer superadmin (proyecto nuevo)
│   └── migrar-a-multitienda.js# Migra datos del repo viejo
└── styles/globals.css         # Sistema de diseño (mismos tokens del original)
```

---

## 🔐 Roles y permisos

**Roles:** `cliente`, `moderador`, `admin_tienda`, `superadmin`.

El SuperAdmin tiene bypass total. Los demás roles se combinan con **permisos granulares** (flags booleanos por usuario) que el SuperAdmin otorga/revoca desde `/admin/users`:

- Moderación: `moderarPublicaciones`, `aprobarTiendas`, `banearUsuarios`, `moderarResenas`, `resolverReportes`
- Tienda: `publicarPrendas`, `editarPrendas`, `eliminarPrendas`, `editarCatalogo`, `verCostoInterno`, `verGanancias`

> La autorización vive **solo** en el backend (`lib/rbac/guards.js`). El frontend oculta botones por UX, pero cada endpoint revalida el permiso. Ocultar un botón nunca es la seguridad.

Para agregar un permiso nuevo: añádelo en `lib/rbac/constants.js` y queda disponible en toda la app.

---

## 🚀 Puesta en marcha

### 1. Requisitos
Node 18+, cuenta en MongoDB Atlas, Vercel y Cloudinary.

### 2. Instalar
```bash
npm install
cp .env.example .env.local   # y llena los valores
```

### 3. Variables de entorno (`.env.local`)
Ver `.env.example`. Genera el `JWT_SECRET` con `openssl rand -base64 48`.
Las llaves de Cloudinary son las mismas que ya usas en tu Vercel actual.

### 4. Inicializar la base de datos
```bash
npm run db:init      # crea colecciones, validadores e índices
```

### 5a. Proyecto NUEVO (sin datos viejos)
```bash
npm run db:seed      # crea el primer superadmin desde las SEED_ADMIN_* del .env
```

### 5b. MIGRAR desde tu repo actual (Catalogodeunbazar)
```bash
npm run db:migrar:dry   # muestra qué haría, sin escribir — REVISA los // ADAPTAR
npm run db:migrar       # ejecuta la migración
```
En `scripts/migrar-a-multitienda.js` hay comentarios `// ADAPTAR` donde debes confirmar los nombres exactos de tus colecciones/campos actuales (`inventario`, `config`, el campo de rol, etc.).

### 6. Correr
```bash
npm run dev          # http://localhost:3000
```

### 7. Desplegar
```bash
vercel --prod
```
Configura las mismas variables de entorno en el dashboard de Vercel.

---

## 🔌 API

| Método | Ruta | Acceso |
|--------|------|--------|
| POST | `/api/auth/register` | Público (crea cliente) |
| POST | `/api/auth/login` · `/logout` | Público |
| GET | `/api/auth/me` | Sesión |
| GET | `/api/prendas` | Público (con filtros) |
| POST | `/api/prendas` | `publicarPrendas` sobre la tienda |
| GET/PUT/DELETE | `/api/prendas/[id]` | GET público; editar/borrar con permiso |
| PUT | `/api/prendas/estado` | `editarPrendas` |
| GET | `/api/tiendas` | Público (aprobadas); pendientes con permiso |
| POST | `/api/tiendas` | Sesión (queda pendiente) |
| GET/PUT | `/api/tiendas/[slug]` | GET público; editar owner/colaborador |
| PUT | `/api/tiendas/aprobar` | `aprobarTiendas` |
| GET | `/api/usuarios` | SuperAdmin |
| PUT | `/api/usuarios/roles` · `/permisos` | SuperAdmin |
| GET/PUT | `/api/usuarios/[id]` | GET público; PUT propio |
| POST | `/api/usuarios/seguir` | Sesión |
| POST | `/api/moderacion/reportes` | Sesión (crear); resolver con permiso |
| POST/PUT | `/api/moderacion/resenas` | Crear con sesión; ocultar con permiso |
| GET/POST/DELETE | `/api/favoritos` | Sesión |
| POST | `/api/upload` | Sesión (Cloudinary) |

---

## ✅ Estado de funcionalidades

Todo lo pedido está implementado y el proyecto compila (31 rutas). La lógica de
roles/permisos y de filtros fue validada con pruebas automatizadas.

- Subida de fotos a Cloudinary desde el panel de admin — **listo**
- Filtro "Add my sizes" (guarda tallas en el perfil y filtra por ellas) — **listo**
- Tabs del perfil de usuario (Favorites carga datos reales, editor de tallas/perfil) — **listo**

> **Nota:** el proyecto compila y su lógica está probada, pero no se ejecutó
> contra una MongoDB real en el entorno de desarrollo. La primera vez que lo
> conectes a tu Atlas es donde se validan los flujos de datos de punta a punta.

---

Hecho conservando la identidad de **stiimpys.store** · Reynosa, Tamaulipas
