# REGALARTE

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
