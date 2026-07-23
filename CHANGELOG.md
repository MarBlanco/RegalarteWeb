# REGALARTE

## 2026-07-21

- **[COMPLETADO]** Sprint 2 — Catalog: Core collections created
  - **Categories** (`src/collections/Categories.ts`): hierarchical (parent/child), name, slug, description (richText), image, isActive, sortOrder
  - **Products** (`src/collections/Products.ts`): name, slug, description (richText), category (required), tags, attributes, images array, price, wholesalePrice, isWholesaleAvailable, stock, SKU, isActive, isFeatured, sortOrder
  - **Attributes** (`src/collections/Attributes.ts`): name, slug, type (text/select/number/boolean), values (for select), unit, isRequired, isFilterable, group
  - **Tags** (`src/collections/Tags.ts`): name, slug, description, color (hex for UI)
  - **CommerceSettings** global (`src/globals/CommerceSettings.ts`): minimumWholesaleOrder, wholesaleEnabled, defaultCurrency
  - All collections added to Payload config, types regenerated (`payload-types.ts`)
  - Typecheck & lint pass

- **[COMPLETADO]** Sprint 2 — Catalog: Frontend catalog page
  - **Catalog page** (`src/app/(app)/catalogo/page.tsx`): server-ready with TanStack Query, filters (category, sort), pagination, grid/list view toggle
  - **ProductCard** component (`src/components/catalog/product-card.tsx`): displays product with image, name, description, price (retail/wholesale based on user type), badges
  - Added shadcn/ui components: Select, Badge, Skeleton, Separator, Pagination
  - API route for products (`src/app/api/products/route.ts`) using Payload local API

- **[COMPLETADO]** Sprint 2 — Catalog: Product Detail page
  - **Product Detail page** (`src/app/(app)/producto/[slug]/page.tsx`): dynamic route with image gallery, breadcrumbs, price display (retail/wholesale), description, specifications, quantity selector, add to cart (integrates with cart store), wishlist, share buttons
  - API route for single product (`src/app/api/products/[slug]/route.ts`)
  - **ProductCard** now integrates with cart store (`useCart` hook) — addItem called on click
  - Typecheck & lint pass

- **[COMPLETADO]** Sprint 2 — Cart integration
  - **Cart store** (`src/hooks/use-cart.ts`): updated to read wholesale status from `useAuth` store, automatically applies wholesale/retail pricing in `getTotal()`
  - **ProductCard** and **ProductDetail** pages integrate with cart — add to cart works for both retail and wholesale users
  - **Cart page** (`src/app/(app)/carrito/page.tsx`): displays cart items with quantity controls, shows wholesale pricing when applicable, validates minimum wholesale order, shipping calculation, proceed to checkout button
  - **CommerceSettings API** (`src/app/api/commerce-settings/route.ts`) for minimum wholesale order config
  - Typecheck & lint pass

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
