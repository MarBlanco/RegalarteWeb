Analizá el archivo:

docs/13_DATABASE_DESIGN.md

Utilizando exclusivamente como contexto:

docs/00_DISCOVERY.md
docs/01_SOURCE_OF_TRUTH.md
docs/02_PRD.md
docs/03_SYSTEM_ARCHITECTURE.md
docs/04_TECHNICAL_ARCHITECTURE.md
docs/05_BUILD_EXECUTION_PLAN.md
docs/06_EXPERIENCE_INTERACTION_DESIGN.md
docs/07_VISUAL_EXPERIENCE_BLUEPRINT.md
docs/08_EXPERIENCE_PRIORITIZATION.md
docs/09_UI_DESIGN_SYSTEM.md
docs/10_SCREEN_BLUEPRINTS.md
docs/10B_HIGH_FIDELITY_SCREEN_BLUEPRINTS.md
docs/10C_VISUAL_ART_DIRECTION.md
docs/10D_VISUAL_MOCKUPS.md
docs/11_FRONTEND_HANDOFF.md
docs/12_BACKEND_HANDOFF.md
docs/17_PWA_STRATEGY.md
docs/18_WHOLESALE_STRATEGY.md

Objetivo:

Actualizar 13_DATABASE_DESIGN.md para que quede alineado con toda la documentación aprobada más reciente.

Reglas:

- No resumir.
- No reestructurar completamente el documento.
- No eliminar entidades existentes.
- No eliminar relaciones existentes.
- Mantener PostgreSQL como base de datos oficial.
- Mantener Payload CMS 3 como CMS oficial.
- Realizar únicamente los cambios mínimos necesarios.

Verificaciones obligatorias:

1. Validar soporte completo para:

- Visitante
- Cliente Minorista
- Cliente Mayorista
- Staff
- Admin

2. Validar incorporación de los campos aprobados:

Users

- customer_type
- cuit
- business_name
- province
- city
- whatsapp

Products

- wholesale_price
- is_wholesale_available

Orders

- order_type

Commerce Settings

- minimum_wholesale_order
- wholesale_enabled

3. Validar enums aprobados:

customer_type

- RETAIL
- WHOLESALE

order_type

- RETAIL
- WHOLESALE

4. Validar que NO existan:

- tablas duplicadas para mayoristas
- catálogos separados
- inventarios separados
- estructuras paralelas

5. Validar compatibilidad completa con:

- Wholesale Strategy V1
- Backend Handoff V1.1
- Frontend Handoff V1.1

6. Revisar entidades relacionadas con:

- Users
- Products
- Orders
- Analytics
- Wishlist
- Gift Finder
- Armá Tu Regalo
- Caja Sorpresa
- Solística

7. Validar índices aprobados:

Users

- customer_type
- cuit

Products

- wholesale_price
- is_wholesale_available

Orders

- order_type

8. Validar restricciones aprobadas:

- CUIT único cuando exista
- wholesale_price >= 0
- fallback a retail_price cuando wholesale_price sea null
- validación de compra mínima configurable

9. Validar compatibilidad con:

- PostgreSQL
- Payload CMS 3
- PWA Strategy V1

10. Revisar cardinalidades, relaciones, constraints, índices y dominios para asegurar consistencia total con la documentación aprobada.

Entregable:

Generar la versión corregida completa de:

docs/13_DATABASE_DESIGN.md

Lista para reemplazar el contenido actual del archivo.

No expliques cambios.

No hagas auditoría.

No hagas comentarios.

Entregar únicamente el contenido final del archivo actualizado.