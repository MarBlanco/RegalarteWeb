# AUDIT-005 — Final Closure Report

**Audit:** Order, Stock & Payment Integrity
**Fecha:** 2026-08-12
**Estado:** ✅ CLOSED
**Alcance:** Cerrar los riesgos pendientes de AUDIT-004 — stock, idempotencia, pago↔orden, transiciones de estado, consistencia carrito→orden, webhooks. Sin cambios de arquitectura, UX/UI ni dependencias nuevas.

---

## Resumen

Se corrigió lo claro y corregible dentro de la arquitectura actual (**guard de transiciones de estado de órdenes**). El resto (stock, idempotencia, pago↔orden real, webhooks) quedó documentado como **ACCEPTED / DEFERRED / BLOCKER** con su dependencia exacta (mayormente TICKET-010 o decisiones de negocio). No hay dinero real en juego hoy: el proveedor de pago sigue siendo mock.

Validaciones finales: **type-check OK · lint 0 errores · 65/65 tests OK (58 + 7 nuevos) · build producción OK**.

---

## Corrección aplicada

### Transiciones de estado de órdenes (solución server-side, sin schema change)

Una actualización de admin podía llevar una orden a cualquier estado (`paid → pending`, `rejected → paid`, `fulfilled → …`), corrompiendo el historial transaccional.

**Fix:**
- Nuevo módulo puro `lib/orders/transitions.ts` con la máquina de estados permitida:
  - `pending → paid | rejected | cancelled`
  - `paid → fulfilled | cancelled` (`cancelled` = reembolso)
  - `rejected`, `cancelled`, `fulfilled` → **terminales**
  - `same → same` permitido (edición sin cambio de estado)
  - `isOrderStatus()` valida el valor.
- `collections/Orders.ts`: `hooks.beforeChange` que lanza error en `update` cuando el cambio de `status` no es válido (en `create` no aplica). El error bloquea la operación vía Payload.

**Tests:** `lib/orders/transitions.test.ts` (7 casos) — transiciones válidas/inválidas, terminales sin salida, regresiones, same→same, validación de valores.

---

## Verificado — sin cambios

- **Precio server-side (AUDIT-004):** intacto. `POST /api/orders` sigue resolviendo `unitPrice`/`totales` exclusivamente desde `Products` en la DB (`lib/orders/lines.ts`). No se revirtió ni duplicó.
- **Nada del cliente muta el estado de la orden:** los únicos accesos públicos son `create` (storefront vía `POST /api/orders`); read/update/delete de Orders son admin/staff, y los updates de estado ahora pasan por el guard. No hay endpoint que reciba un callback del frontend para cambiar `status`.

---

## ACCEPTED / DEFERRED / BLOCKER — pendientes aceptados

| # | Ítem | Clasificación | Detalle / dependencia exacta |
|---|------|---------------|------------------------------|
| B-01 | **Stock no validado ni descontado** | **BLOCKER (pre-pagos reales)** | La semántica de `Products.stock` es ambigua (default 0 vs ilimitado) y exigirla hoy rompería todo el catálogo. Implementación correcta requiere: (1) decisión de negocio sobre semántica (0 = agotado / null = ilimitado), (2) operación transaccional `stock -= qty` con guarda `stock >= qty`, (3) reversión ligada al resultado del pago. Todo depende de TICKET-010. Hoy el provider es mock → sin impacto monetario. |
| D-01 | **Idempotencia de órdenes** | **DEFERRED** | Doble submit/retry puede crear órdenes duplicadas. La solución robusta = campo `requestId` `unique` (enviado por el storefront) + `find`-atómico-`create` + manejo de violación `unique` devolviendo la orden existente. Requiere **migración de base de datos**; la DB local no está disponible (err 57P03) y el esquema usa `push:false` → no es seguro aplicar el cambio de schema sin migración. **Receta:** aplicar junto a TICKET-010 (misma ventana de infraestructura). Mitigación actual: el botón submit se deshabilita durante el procesamiento (no cubre retries de red). |
| D-02 | **Pago ↔ orden / webhooks** | **DEFERRED (TICKET-010)** | Provider es mock estructural: no crea preference real, no hay webhooks, `paymentProvider`/`paymentExternalId` nunca se completan y no hay reconciliación. TICKET-010 debe implementar: preferencia creada por el **backend** (secretos fuera del bundle), endpoint de webhook/confirmation **server-validado**, transiciones automáticas `pending → paid | rejected` por resultado de pago, y asociación `payment ↔ order`. Nada de esto se inventó. |
| D-03 | **Pantalla de retorno post-pago** | **ACCEPTED/DEFERRED** | `createOrder` devuelve `redirectUrl = /checkout/orden/:id?...`; la ruta NO existe y el UI hoy no navega (muestra banner inline "Pedido enviado"). No hay impacto de datos ni 404 activo. El flow real de retorno será definido por TICKET-010. |
| W-01 | **Diferencia de precio carrito ↔ orden** | **ACCEPTED** | El total client-side puede diferir del total server-side si el precio cambió; el server es autoritativo (por diseño). UX de notificación queda a decisión de producto. |

---

## Tests

- **7 nuevos** (`transitions.test.ts`) exclusivamente para la corrección.
- **65/65 tests totales PASS** (pricing 20, checkout 16, payment 15, orders.lines 7, orders.transitions 7).

## Impacto

- Sin dependencias nuevas, sin cambios de UX/UI, sin migraciones forzadas.
- El guard de transiciones aplica a admin/staff (los únicos con `update` en Orders); el storefront no se ve afectado.
- Build de producción completo exitoso.