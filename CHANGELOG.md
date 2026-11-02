# REGALARTE

## 2026-11-02

- **[RUNTIME]** Node mínimo 20.9 → 22 (`engines` raíz y `.nvmrc`): jsdom exige `undici` 8 y Node 20 ya no tiene soporte; app, tests, CI y Vercel quedan alineados.
- **[SEGURIDAD]** `overrides` en el `package.json` raíz para `esbuild` (0.28.2), `minimatch` (11.0.1) y `postcss-selector-parser` de `@tailwindcss/typography` (6.1.5): se eliminan 3 de los 4 avisos aceptados de `osv-scanner.toml`. Queda solo `deepmerge` 4.3.1 (sin versión corregida), vence el 2027-02-01.

## 2026-11-01

- **[DEPENDENCIAS]** Tailwind CSS 3.4 → 4.3 con la herramienta oficial de migración. La configuración pasó a `globals.css` (`@theme`, `@plugin` de typography y forms); `autoprefixer` se reemplazó por `@tailwindcss/postcss`. Se agregó una utilidad `space-y-*` con la semántica de v3 (v4 pone el margen en el hermano anterior y no afecta a `<label>` inline) y se revirtió un renombre falso de `variant="outline"`. Verificado con capturas de 18 páginas en 390 y 1280 px contra la versión anterior.

- **[DEPENDENCIAS]** TypeScript 5.9.3 → 7.0.2 en `apps/web` (tsconfig `target` es5 → ES2022, removido en TS 7). La raíz mantiene `typescript ~5.9.3` para `typescript-eslint`. Type-check, lint, 575 tests y build verificados.

- **[AUDITORIA]** Auditoría integral con QA exploratoria (`.harness/qa/20261101-regalarte-integral/`) y correcciones.
  - **[SEGURIDAD]** `POST /api/orders` solo acepta `mode: WHOLESALE` de una sesión con `customer_type` mayorista (antes cualquiera obtenía precio B2B). Las rutas de `/api/edit-mode` autentican antes de validar el cuerpo.
  - **[NEGOCIO]** El servidor rechaza ítems con cantidad mayor al `stock` (sumando líneas del mismo producto) y precio resultante menor o igual a cero.
  - **[VALIDACION]** Reglas únicas de teléfono, dirección, ciudad, provincia y código postal (`lib/checkout/validation.ts`), usadas por checkout, `POST /api/orders` y el perfil.
  - **[AUTH]** `/orders` y `/profile` ya no redirigen al login antes de resolver la sesión (cookie incluida); el logout no dispara un segundo POST.
  - **[SEO]** Sin canonical global a la home (cada página declara el suyo), datos estructurados `Product`, sitemap con productos y `robots.txt` ampliado.
  - **[UI]** Un solo `<main>` por página, modales de edición fuera de formularios (sin `<form>` anidado), notas aromáticas solo con datos reales, descuento en el detalle de "Mis compras", tap targets de 44 px en móvil, aviso de pago simulado en la confirmación.
  - **[NEGOCIO]** Tope de 10 unidades por producto (carrito, ficha y servidor). El texto de un pedido pendiente ahora dice "Recibimos tu pedido / pendiente de pago". El canal mayorista exige `wholesale_enabled` activo además de una cuenta mayorista.
  - **[CI]** El workflow ejecuta los tests de Vitest.
  - **[DOCS]** `CLAUDE.md`: versiones reales (Next 16.4.2, Payload 3.92.0), `AGENTS.md` de OpenCode, capacidades del Harness por plugins.

## 2026-07-27

- **[COMPLETADO]** Sprint 3 — Storefront del carrito (paso 1/2/3).
  - **[INFRA]** Carrito Zustand con persistencia en `localStorage` (key `regalarte-cart-v1`, versionada, `partialize`, `onRehydrateStorage`, `migrate` defensivo), selector `hydrated` para evitar hydration mismatch.
  - **[INFRA]** Pricing resolvers puros: `resolveUnitPrice` con fallback minorista cuando el mayorista no aplica (regla `13_DATABASE_DESIGN`), `getSubtotal`, `getTotals`, `clampQuantity`.
  - **[UI]** Drawer del carrito con backdrop, ESC keyboard support, scroll lock del body, controles `+`/`-` por item, eliminar individual, vaciar, subtotal y total.
  - **[UI]** Botón "Agregar al carrito" en la Product Detail Page con selector de cantidad (capado por stock), feedback "Agregado ✓" y apertura automática del drawer.
  - **[UI]** Trigger del carrito en el header con contador en tiempo real y badge numerico (badge oculto cuando el contador es 0 o no hidrato).
  - **[UI]** Página `/cart` con breadcrumb, header, lista editable, card de resumen (cantidad, modo de precios activo, subtotal, total), CTAs (Seguir comprando, Vaciar, Continuar con el checkout) y empty state con CTA al catálogo.
  - **[UI]** Empty state dedicado para `/cart` cuando no hay productos.
  - **[INTEGRACION]** `CartProvider` integrado dentro del árbol de `Providers` global. `Header` actualizado para reemplazar el link estático a `/cart` por el `CartTrigger`.
- **[NOTA]** Tareas pendientes del Sprint 3 (no realizadas en este commit): checkout, integración Mercado Pago, pedidos/orders y sincronización server del carrito para usuarios autenticados.

## 2026-07-23

- **[COMPLETADO]** Sprint 2 — Backend del catálogo y storefront completo.
  - **[BACKEND]** Colecciones Payload: `Categories`, `ProductTags`, `Products`, `ProductAttributes`, `ProductImages` registradas en `payload.config.ts`.
  - **[BACKEND]** `Products` modela title/slug, descripción richText (Lexical), precios (minorista + tachado + mayorista + flag `isWholesaleAvailable`), SKU, stock, badges (`featured`, `active`, `isSolistica`, `sortOrder`), relaciones (categoría, tags, atributos, imágenes), SEO (`seoTitle`, `seoDescription`). Principio "no catálogos paralelos" aplicado: el universo Solística se representa como booleano sobre el mismo producto, no como colección aparte.
  - **[BACKEND]** `ProductImages` como colección upload con `imageSizes` (thumbnail/card/desktop), `focalPoint` y `staticDir` local; integración con R2 pendiente de activación real.
  - **[BACKEND]** `ProductAttributes` con lista de valores (`values: { value, sortOrder }`).
- **[CORREGIDO]** Causa raíz del `Internal server error` (Postgres `42P16: la columna id está en la llave primaria`) en `/admin` y `/api/*`:
  - `push: false` en `postgresAdapter` para deshabilitar la reconciliación automática del schema en cada arranque.
  - Primera migración formal versionada: `apps/web/src/migrations/20260723_105205.{ts,json}` + `index.ts`. Generada vía `payload migrate:create`.
- **[FRONTEND]** `/catalogo` con `ProductGrid` (cards), `CatalogFilters` (búsqueda libre, categoría, tag, rango de precio, sort), `CatalogPagination`, loading skeleton y empty state.
- **[FRONTEND]** Product Detail Page en `/catalogo/[slug]` con `generateMetadata` (SEO dinámico), `notFound()` + `not-found.tsx` para slug inexistente, `ImageGallery` client con thumbnails, badges (Destacado/Solística/Mayorista), precio + precio tachado + precio mayorista, `stockLabel` por niveles, descripción Lexical con renderer ligero, tags como chips y atributos como filas.
- **[DESIGN]** Primitive shadcn `Badge` (variants: default/secondary/destructive/accent/outline/wholesale) alineado a los tokens del design system.
- **[LIB]** `lib/format.ts` con `formatPrice` (es-AR, ARS, 0 fracciones) compartido por `ProductCard` y PDP.
- **[LIB]** `lib/product-by-slug.ts` con helper de fetch bracket-notation REST Payload (`?where[slug][equals]=...`) para resolver productos por slug.
- **[LIB]** `lib/catalog.ts` con `fetchProducts`, `fetchCategories`, `fetchProductTags` (server fetch + `revalidate` + cache por tags).
- **[NOTA]** Smoke tests durante implementación insertaron 3 productos y 1 categoría (`vela-aromatica-001`, `gift-box-001`, `difusor-premium-001`) directamente en la DB local. Sin imágenes porque R2 está desactivado por placeholders; los endpoints devuelven `image:null` y la UI muestra fallbacks.
- **[VERIFICADO]** `/catalogo` 200 con grid; PDPs 200 para slugs válidos; PDP inexistente renderiza `not-found.tsx` (status 200 por comportamiento conocido de Next 15 `notFound()` en dev); `/admin` 307 → `/admin/login`; todos los `/api/*` 200 sin `42P16`.
- **[VERIFICADO]** `tsc --noEmit`: 0 errores nuevos (sólo los 2 preexistentes autogenerados por Payload).

## 2026-07-22

- **[SETUP]** Causa raíz de `Cannot find package '@/collections'` resuelta: agregado `"type": "module"` en `apps/web/package.json`. Sin esto, `tsx` + Node ESM no respetaban los `paths` de `tsconfig.json` (`@/*`, `@payload-config`) y `payload generate:types` fallaba con `ERR_MODULE_NOT_FOUND`. Cambio soportado oficialmente por Payload 3 y documentado en el issue upstream.
- **[CORREGIDO]** Imports relativos rotos en `payload.config.ts` corregidos al cambiar a `"type": "module"`.

## 2026-07-20

- **[COMPLETADO]** Auth pages wired to Payload REST API:
  - Register: `POST /api/users` + auto-login after registration
  - Login: `POST /api/users/login` with JWT token storage
  - Forgot Password: `POST /api/users/forgot-password`
  - Reset Password: `POST /api/users/reset-password` with token
  - Verify Email: `POST /api/users/verify` with token
  - Profile: `PATCH /api/users/:id` with auth header
- **[CORREGIDO]** Users collection `role` field access control — cleaned up for proper first-user creation via `/admin/create-first-user`
- **[VERIFICADO]** Payload admin panel correctly detects empty users table and redirects to `/admin/create-first-user`
- **[NOTA]** Sprint 1 — Foundation complete. All auth flows functional (register, login, forgot/reset password, email verification, profile update).

## 2026-07-18

- **[SETUP]** Configuración de entorno de desarrollo documentada.
- **[SETUP]** Requiere Node >= 20 (usar `nvm use 20.19.5`).
- **[SETUP]** PostgreSQL inicializado localmente: usuario `regalarte_user`, base `regalarte_db`, puerto 5432.
- **[SETUP]** PAYLOAD_SECRET generado en `.env.local`.
- **[SETUP]** Email adapter (Resend) configurado en `payload.config.ts` para eliminar warning de email.
- **[SETUP]** `importMap.js` regenerado (`generate:importmap`) y rutas corregidas en `not-found.tsx` / `page.tsx` del admin (`../importMap.js`).
- **[NOTA]** Pendiente: instalar `sharp` para image resizing (warning no bloqueante en dev).

## 2026-07-18

- **[COMPLETADO]** Sprint 1 — Foundation completa.
- **[COMPLETADO]** Cloudflare R2 configurado con storage adapter S3 en Payload CMS.
- **[COMPLETADO]** Design System base: Tailwind con colores de marca, CSS custom properties, shadcn/ui (Button, Input, Label, Card), dark mode, tipografía (Inter + Playfair Display).
- **[COMPLETADO]** Layouts: Header sticky con navegación principal, iconos (search, wishlist, cart, user), Footer completo con links de navegación, ayuda y wholesale.
- **[COMPLETADO]** Auth + Roles: Colección Users extendida con customer_type (RETAIL/WHOLESALE), role (visitor/retail/wholesale/staff/admin), name, phone, business_name, cuit, province, city, whatsapp. Auth con Payload (login, register, forgot password, verify email).
- **[COMPLETADO]** Providers: AuthProvider, QueryProvider (TanStack React Query), CartStore (Zustand con persistencia).
- **[COMPLETADO]** Páginas de Auth: Login, Register (con selector minorista/mayorista y campos condicionales), Forgot Password, Reset Password, Verify Email, Profile.
- **[COMPLETADO]** Homepage rediseñada con hero discovery-first y navegación a experiencias principales.

## 2026-06-25

- **[EN PROGRESO]** Etapa de Foundation iniciada.
- **[COMPLETADO]** Next.js 15 y dependencias base configuradas en monorepo.
- **[COMPLETADO]** Payload CMS 3 inicializado con PostgreSQL.
- **[COMPLETADO]** Variables de entorno base configuradas.
- **[PENDIENTE]** Cloudflare R2, Autenticación, Roles, Providers, Layouts, Theme.

## 2026-06-23

- Initial documentation foundation.
- Discovery completed.
- Architecture completed.
- UX completed.
- UI completed.
- Database completed.
- PWA Strategy completed.
- Wholesale Strategy completed.
- Ready For Build.
