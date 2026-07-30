## Sprint 3 — Compra

| Ticket | Descripción | Responsable | Estado |
|---------|-------------|-------------|--------|
| TICKET-005 | Infraestructura del carrito | Martín | ✅ COMPLETADO |
| TICKET-006 | Drawer + Add to Cart | Martín | ✅ COMPLETADO |
| TICKET-007 | Página del carrito | Martín | ✅ COMPLETADO |
| TICKET-008 | Checkout | Martín | ✅ COMPLETADO |
| TICKET-009 | Orders | MANCHY | ✅ COMPLETADO |
| TICKET-010 | Mercado Pago | Martín | ✅ COMPLETADO |
| TICKET-011 | Sincronización del carrito | MANCHY | ⏳ PENDIENTE |

---

## Cierre TICKET-010 — Pago

Fecha: 2026-07-29

Ticket cerrado:
- TICKET-010

Resumen:
- Implementado PaymentProvider configurable mediante variable de entorno.
- Se incorporó soporte para MockPaymentProvider y MercadoPagoProvider.
- La selección del provider se realiza mediante NEXT_PUBLIC_PAYMENT_PROVIDER.
- El comportamiento por defecto continúa utilizando MockPaymentProvider.
- Se realizaron mejoras menores de UX y accesibilidad del Checkout.
- Se añadieron estados visuales de carga.
- Se mejoró feedback para campos inválidos.
- Se eliminaron pequeños code smells.
- Typecheck verificado.
- Sin cambios arquitectónicos.
- Sin cambios funcionales.

Estado del proyecto:

Sprint 3

- ✅ TICKET-005
- ✅ TICKET-006
- ✅ TICKET-007
- ✅ TICKET-008
- ✅ TICKET-009
- ✅ TICKET-010
- ⏳ TICKET-011 (MANCHY)

---

## Cierre TICKET-009 — Orders

Fecha: 2026-07-30

Ticket cerrado:
- TICKET-009

Resumen:
- Creada la colección Payload `Orders` con snapshot inmutable de items + customer + address + totales.
- Registrada la colección en `payload.config.ts` bajo el grupo `Operación`.
- Generada migración formal `20260730_020853` con todas las tablas, enums, FKs e índices.
- Regenerado `payload-types.ts` con la nueva interfaz `Order`.
- Implementado service `createOrder` con cálculo de totales server-side y generación de `orderNumber`.
- Creado endpoint `POST /api/orders` con validación de campos requeridos y mapeo HTTP.
- Reemplazado el mock de `submitCheckout` por fetch real al endpoint, preservando el contrato público.
- Vaciado automático del carrito al confirmar la creación exitosa de la Order.
- Typecheck verificado.
- Sin cambios arquitectónicos.
- Sin cambios funcionales.

Estado del proyecto:

Sprint 3

- ✅ TICKET-005
- ✅ TICKET-006
- ✅ TICKET-007
- ✅ TICKET-008
- ✅ TICKET-009
- ✅ TICKET-010
- ⏳ TICKET-011 (MANCHY)
