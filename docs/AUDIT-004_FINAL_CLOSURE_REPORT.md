# AUDIT-004 — Final Closure Report

**Audit:** Ecommerce Critical Flows & Data Integrity
**Fecha:** 2026-08-12
**Estado:** ✅ CLOSED
**Alcance:** Consistencia y seguridad de flujos comerciales críticos (productos, carrito, checkout, órdenes, pagos, integridad) antes de Go Live. Sin funcionalidad nueva ni refactors generales.

---

## Resumen

Se verificó el flujo completo **catálogo → carrito → checkout → orden → pago**. Se corrigió el hallazgo crítico de integridad de precios (W-01 de AUDIT-003) y se documentaron los riesgos que requieren decisión de negocio/arquitectura. No hay dinero real en juego hoy (provider de pago es mock), pero los totales de orden ahora son autoritativos desde la DB.

Validaciones finales: **type-check OK · lint 0 errores · 58/58 tests OK (51 + 7 nuevos) · build producción OK**.

---

## Corrección aplicada (crítica)

### W-01 — Precios confiados del cliente en `POST /api/orders`

**Antes:** `lib/orders/service.ts` calculaba `unitPrice`/`totals` con `item.price` y `item.wholesalePrice` enviados por el cliente. Un atacante podía enviar `price: 1` o `mode: WHOLESALE` con `wholesalePrice: 0.01` y la orden se persistía con totales manipulados.

**Ahora — recálculo server-side sin cambiar arquitectura:**
- Nuevo módulo puro `lib/orders/lines.ts`:
  - `buildLinesFromProducts(input, productsById)`: resuelve identidad (`slug`/`name`) y `unitPrice` desde el **Producto en la DB** (`price`, `wholesalePrice`, `isWholesaleAvailable`) aplicando las reglas de `lib/cart/pricing.ts`. El payload del cliente solo aporta `id` (variante), `productId` y `quantity`.
  - Rechaza la orden (`OrderRejectedError`) si el producto **no existe o no está activo**.
  - Normaliza cantidad (`floor` ≥ 1) y redondea totales a 2 decimales (`roundMoney`).
- `lib/orders/service.ts`: consume `loadProducts()` (query `products` por `id.in`, `depth: 0`) y persiste líneas con precios de DB.
- `app/api/orders/route.ts`: `OrderRejectedError` → **409** con mensaje amigable (productos no disponibles); demás errores → 500 genérico (sin leak).

**Tests nuevos:** `lib/orders/lines.test.ts` (7 casos) — precio retail/wholesale de DB gana al del cliente, fallback retail, producto inactivo/inexistente rechazado, normalización de cantidad y redondeo de totales.

---

## WARNING / BLOCKER — Requieren decisión (no se corrigieron)

| # | Hallazgo | Riesgo | Acción sugerida |
|---|----------|--------|-----------------|
| B-01 | **Stock no validado ni descontado al crear la orden.** `Products.stock` existe pero no se usa en checkout; `clampQuantity` es solo client-side. | **Alto al conectar pagos reales** — permite vender más stock del disponible. Hoy sin impacto monetario. | BLOCKER pre-pagos reales: validar disponibilidad + descuento/reserva de stock al confirmar la orden (mecánica de negocio a definir). |
| W-01 | **Duplicación de órdenes.** `POST /api/orders` no es idempotente: doble submit o retry crea dos órdenes con el mismo carrito. El botón deshabilitado mitiga solo el doble clic. | Medio | Idempotency key (nuevo contrato API + UI) o dedupe por `(email + hash de items)` con ventana de tiempo. |
| W-02 | **Estado pago↔orden inmaduro.** El provider es mock estructural: no crea preference real, no hay webhooks, `paymentProvider`/`paymentExternalId` nunca se completan y la confirmación es simulada. | Bajo hoy (no hay dinero real) | TICKET-010 real: preferencia creada por el backend (secretos fuera del bundle), webhook/confirmation server-validado, reconcilación pago↔orden. |
| W-03 | **Transiciones de estado de orden sin guards.** `status` se cambia manualmente en admin (paid→cancelled, etc.) sin workflow/hooks. | Medio con pagos reales | Hook/hardening de transiciones (approved/cancelled) antes de Go Live. |
| W-04 | **Precio puede cambiar entre carrito y orden.** El total client-side se muestra con precios viejos; el server crea la orden con precios nuevos. | Bajo (server es autoritativo) | UX a decidir: notificar diferencia de precios antes de confirmar. |

---

## Verificación de flujos — OK

- **Carrito → snapshot:** `CartItem` es snapshot inmutable; store pure/determinista; `resolveUnitPrice` correcto (retail/wholesale/fallback); subtotales ≥ 0.
- **Checkout validaciones:** client (`validation.ts`) y server (`route.ts`) validan cliente, dirección, modo e items; email y teléfono, cantidades > 0, precios ≥ 0.
- **Orden:** `Cache-Control: no-store`; `orderNumber` único con `crypto.randomBytes`; totales recalculados server-side (AUDIT-004); datos de cliente/dirección persistidos sin datos de pago.
- **Pagos:** `MercadoPagoProvider` sin SDK/credentials en el bundle cliente; factory separa secretos; contrato `PaymentProvider` estable.
- **Security/AUTH-003 baseline:** headers, HSTS, remotePatterns restringidos, accesos de collections hardening, sin secretos en repo.

---

## Impacto

- Ninguna dependencia nueva. Ningún cambio de UI/UX.
- Contrato `PaymentProvider`, flujos de checkout y página de confirmación sin cambios.
- 7 tests nuevos solo para la corrección crítica de dinero/precios, sin cobertura artificial.
- Build de producción completo exitoso.