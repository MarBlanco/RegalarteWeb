REGALARTE — INSTRUCCIONES DE INICIO DE DESARROLLO

Estado del proyecto:

READY FOR BUILD

Repositorio GitHub:

https://github.com/MarBlanco/RegalarteWeb

IMPORTANTE

Este proyecto NO está en fase de Discovery.

NO está en fase de diseño.

NO está en fase de arquitectura.

Toda la documentación se considera:

APPROVED
FROZEN
SOURCE OF TRUTH

No rediseñar producto.
No modificar UX.
No modificar UI.
No modificar arquitectura.
No agregar funcionalidades.
No eliminar funcionalidades.

--------------------------------------------------

PASO 1

Clonar repositorio:

git clone https://github.com/MarBlanco/RegalarteWeb.git

Abrir el proyecto completo.

--------------------------------------------------

PASO 2

Leer primero:

docs/README.md

--------------------------------------------------

PASO 3

Leer completo:

docs/PROJECT_CONTEXT.md

Objetivo:

Entender qué es REGALARTE.

--------------------------------------------------

PASO 4

Leer completo:

docs/CURSOR_ONBOARDING.md

Objetivo:

Entender reglas de trabajo.

--------------------------------------------------

PASO 5

Leer completo:

docs/20_CURSOR_PROJECT_FOUNDATION.md

Objetivo:

Entender cómo debe inicializarse el repositorio.

--------------------------------------------------

PASO 6

Leer completo:

docs/21_IMPLEMENTATION_ROADMAP.md

Objetivo:

Entender el orden oficial de construcción.

--------------------------------------------------

PASO 7

Leer completo:

docs/22_CURSOR_EXECUTION_PROTOCOL.md

Objetivo:

Entender las reglas operativas obligatorias.

--------------------------------------------------

PASO 8

Tomar como documentación principal:

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
docs/13_DATABASE_DESIGN.md
docs/13B_DATABASE_DESIGN_REVIEW.md
docs/14_CURSOR_MASTER_BUILD_PROMPT.md
docs/17_PWA_STRATEGY.md
docs/18_WHOLESALE_STRATEGY.md

--------------------------------------------------

PASO 9

Validar que el proyecto mantiene:

- Un único catálogo
- Un único inventario
- Un único CMS
- Un único checkout
- Una única aplicación web
- Una única PWA
- Un único backend

--------------------------------------------------

PASO 10

Validar soporte para:

Visitor
Retail Customer
Wholesale Customer
Staff
Admin

--------------------------------------------------

PASO 11

Validar funcionalidades aprobadas:

- Ecommerce B2C
- Ecommerce B2B (Mayoristas)
- PWA
- Gift Finder
- Gift Discovery
- Wishlist
- Armá Tu Regalo
- Caja Sorpresa
- Universo Solística

--------------------------------------------------

PASO 12

INICIAR CONSTRUCCIÓN

Comenzar EXCLUSIVAMENTE por:

PHASE 0 — PROJECT FOUNDATION

Utilizar como guía:

docs/20_CURSOR_PROJECT_FOUNDATION.md

y

docs/21_IMPLEMENTATION_ROADMAP.md

--------------------------------------------------

NO COMENZAR POR:

- Home
- Catálogo
- Checkout
- Gift Finder
- Solística
- Admin

--------------------------------------------------

ORDEN OBLIGATORIO

PHASE 0
Project Foundation

↓

PHASE 1
Database & Payload Foundation

↓

PHASE 2
Authentication & Roles

↓

PHASE 3
Catalog Core

↓

PHASE 4
Commerce Core

↓

PHASE 5
Wholesale Layer

↓

PHASE 6
Discovery Commerce

↓

PHASE 7
Differentiators

↓

PHASE 8
Solística Universe

↓

PHASE 9
Marketing Layer

↓

PHASE 10
PWA

↓

PHASE 11
Admin & Operations

↓

PHASE 12
Hardening

↓

PHASE 13
Production Readiness

--------------------------------------------------

REGLA OPERATIVA

Antes de escribir código:

1. Analizar documentación relacionada.
2. Detectar dependencias.
3. Generar plan de implementación.
4. Ejecutar.
5. Validar Definition of Done.
6. Realizar commit.

--------------------------------------------------

FORMATO DE COMMITS

PHASE 0 - Foundation complete

PHASE 1 - Database foundation complete

PHASE 2 - Auth and roles complete

PHASE 3 - Catalog core complete

etc.

--------------------------------------------------

OBJETIVO FINAL

Construir exactamente el producto definido en la documentación aprobada.

No reinterpretar.

No rediseñar.

No improvisar.

Implementar.