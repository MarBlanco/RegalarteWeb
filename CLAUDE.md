# CLAUDE.md — RegalarteWeb

Contrato operativo de Claude Code para este repositorio. Es el único archivo de reglas: no existe `AGENTS.md` ni otro paralelo.

## 1. Contexto

REGALARTE es una plataforma de Discovery Commerce de regalos (B2C minorista + B2B mayorista, universo Solística, PWA). Solística es un booleano (`isSolistica`) sobre el mismo producto, no un catálogo paralelo. La descripción de producto vive en `docs/PROJECT_CONTEXT.md`; no se copia acá.

## 2. Stack real (verificado en `package.json`)

- Monorepo npm workspaces (`apps/*`); única app: `apps/web`.
- Next.js `16.2.12` (App Router), React `19.1.0`, TypeScript, Tailwind `3.x`, shadcn/ui (Radix), Framer Motion, Zustand, TanStack Query.
- Payload CMS `3.87.1` con `@payloadcms/db-postgres`, Lexical, `storage-s3` (Cloudflare R2), `email-resend`.
- Tests: Vitest (jsdom). Lint: ESLint 9.
- Node `>=20.9.0` (`engines` en el `package.json` raíz; CI usa Node 20).
- Deploy: Vercel (`apps/web/vercel.json`).

Atención: `FOUNDATION.md` y `docs/README.md` dicen "Next.js 15" y "PRE BUILD". Prevalece `package.json`.

## 3. Estructura relevante

- `apps/web/src/app/(app)/` — storefront (`catalogo`, `cart`, `checkout`, `solistica`, `wishlist`, `profile`, `auth`, `ayuda`, `buscar`).
- `apps/web/src/app/(payload)/` — admin y API de Payload.
- `apps/web/src/app/api/` — rutas propias (p. ej. `orders`).
- `apps/web/src/collections/`, `globals/` — modelo de datos Payload.
- `apps/web/src/migrations/` — migraciones versionadas.
- `apps/web/src/lib/` — lógica de dominio (`cart`, `checkout`, `orders`, `payment`, `catalog`, `wishlist`, `analytics`).
- `apps/web/src/payload.config.ts` — configuración de Payload.
- `apps/web/scripts/migrate-on-build.mjs` — migra en el build de Vercel.
- `.github/workflows/` — CI, CodeQL, SonarCloud.
- `.claude/agents/`, `.claude/skills/` — capacidades de Claude Code.

## 4. Jerarquía de autoridad

1. Código ejecutable y estado Git real.
2. `docs/AUDIT-*` y blocker reports (`docs/24`–`28`) cuando aportan evidencia verificable.
3. `docs/PROJECT_CONTEXT.md` y documentación vigente respaldada por el código.
4. Resto de la documentación.
5. Documentación histórica.

La documentación nunca se impone al estado verificable del código. Ante diferencia material entre documentación y repositorio, hacer una Reality Audit antes de implementar.

Estado y seguimiento (`WORKING.md`, `CHANGELOG.md`, `docs/BUILD_STATUS.md`, `docs/SPRINTS.md`) son informativos, pueden estar desactualizados y nunca superan al código.

### Documentación no confiable como especificación

`docs/00`–`docs/22` contienen prompts de generación ("Analizá el archivo…", "Actuá como…"), no especificaciones finales. No tratarlos como fuente de requisitos y no reconstruir ni inventar el contenido que debieron producir. `decisions/`, `handoffs/` y `prompts/` están vacíos o con placeholders: verificar antes de citarlos.

## 5. Reglas permanentes

- Documentation First, pero Reality > Documentation.
- No Assumptions: verificar en el repo antes de afirmar.
- Source of Truth según la jerarquía de la sección 4.
- Trazabilidad (ticket, auditoría o commit) cuando corresponda.
- Separar intención, especificación, documentación, arquitectura, implementación, verificación, QA y release.
- Documentación justa: no crear documentos que nadie pidió.
- Build Readiness antes de declarar algo listo para construir.
- Infrastructure Ready ≠ Product Ready ≠ Go Live Ready.
- Las afirmaciones importantes requieren evidencia. Tests PASS no implican Product Complete. HTTP 200 no implica funcionalidad completa.
- No usar DONE / COMPLETE / VERIFIED / READY sin evidencia suficiente. Un documento que lo declare no es evidencia.
- Inspeccionar antes de modificar. Cambios mínimos y controlados. No eliminar funcionalidades sin autorización.
- Verificar después de cada implementación.

### Autonomía y convergencia

- Resolver de punta a punta todo lo técnicamente posible.
- Ante un problema: DIAGNOSTICAR → RESOLVER → VERIFICAR → CONTINUAR.
- Si una solución falla, reevaluar la causa raíz y cambiar de estrategia. No repetir indefinidamente la misma acción.
- No delegar al usuario decisiones o acciones técnicas que Claude Code pueda realizar.
- La tarea termina únicamente con éxito verificado o ante un bloqueo real que requiera intervención humana.

## 6. Workflow

INSPECT → IDENTIFY → PLAN → IMPLEMENT → VERIFY → FIX → VERIFY → FINAL ACTION → REPORT

El proceso debe converger hacia un estado final verificable.

El reporte final dice qué se hizo, con qué evidencia se verificó, qué acción final se ejecutó y qué queda pendiente o no verificado.

## 7. Restricciones técnicas verificadas

- `apps/web/src/payload-types.ts` es autogenerado (`npm run generate:types --workspace=apps/web`). No editarlo a mano.
- Cambios de schema solo vía migraciones versionadas (`npm run migrate:create --workspace=apps/web`). El adapter usa `push: false` y `prodMigrations`. No generar ni tocar el schema fuera de ese mecanismo.
- `apps/web/package.json` tiene `"type": "module"`. Los alias `@/*` y `@payload-config` dependen de eso.
- Si se agregan componentes al admin, regenerar el import map (`generate:importmap`). El import map y `payload-types.ts` no se autogeneran al arrancar (`autoGenerate: false` en `payload.config.ts`): regenerar el import map con las variables de R2 definidas, o pierde el handler de `storage-s3`.
- `package-lock.json` fija `dompurify` y `happy-dom` a mano (los `overrides` de npm no aplican a esas dependencias). Si se regenera el lockfile, correr `npm audit --omit=dev`: el CI lo exige en nivel alto.
- Precios (`apps/web/src/lib/cart/pricing.ts`): el mayorista aplica solo si el modo es `WHOLESALE`, el producto tiene `isWholesaleAvailable` y `wholesalePrice` es un número finito `>= 0`. En cualquier otro caso se usa el precio minorista.
- Pagos: `getPaymentProvider()` devuelve `mock` por defecto; `mercadopago` solo con `NEXT_PUBLIC_PAYMENT_PROVIDER=mercadopago`.
- R2 y Resend se activan solo si sus variables existen y no empiezan con `placeholder`.
- El build de Vercel corre `scripts/migrate-on-build.mjs` y aplica migraciones pendientes si hay `DATABASE_URI` y `PAYLOAD_SECRET`.
- `.env*` está ignorado por git. Nunca commitear ni imprimir secretos.

## 8. Comandos (desde la raíz)

- `npm run dev` · `npm run build` · `npm run lint` · `npm run type-check` (delegan en `apps/web`).
- Tests: `npm run test --workspace=apps/web` (Vitest; no hay script `test` en la raíz).
- Payload: `npm run migrate | migrate:status | migrate:create | migrate:down | generate:types | generate:importmap --workspace=apps/web`.

CI (`.github/workflows/ci.yml`) ejecuta type-check, lint y build en cada PR y en push a `main`. No ejecuta los tests de Vitest. Antes de declarar un cambio verificado, correr los que apliquen: type-check, lint, test y build. Si no se corrió alguno, decirlo.

## 9. Referencias (consultar según la tarea, evaluando vigencia)

- `docs/PROJECT_CONTEXT.md` — producto, modelos de negocio, principios.
- `FOUNDATION.md` — stack declarado (parcialmente desactualizado).
- `WORKING.md` — tickets y auditorías (estado informativo).
- `docs/AUDIT-001`…`006` — evidencia de cierre; AUDIT-006 fija qué está ACCEPTED/DEFERRED.
- `docs/24`–`28` — blocker reports por ticket.
- `docs/CI_QUALITY_GATES.md`, `docs/29`–`31` — CI, branch protection, CodeRabbit, SonarCloud. Describen configuración recomendada: verificar el estado real (p. ej. con `gh`) antes de asumirla activa.
- `docs/knowledge/*` — PWA, Solística, Wholesale, Discovery Commerce.

## 10. Git y protección del estado local

- Antes de modificar archivos, inspeccionar el working tree (`git status`).
- Preservar las modificaciones locales existentes y no sobrescribir cambios ajenos a la tarea.
- No ejecutar `git pull`, `reset`, `restore`, `checkout` ni `clean` sobre cambios locales sin autorización explícita.
- Ejecutar commit, push, merge u otras acciones Git finales cuando formen parte del objetivo de la tarea y Claude Code tenga capacidad para realizarlas.
- No delegar al usuario acciones Git que Claude Code pueda ejecutar y verificar.
- No pushear directamente a `main` si la protección del repositorio exige rama/PR.
- Archivos autogenerados (`payload-types.ts`) pueden aparecer modificados por herramientas: no incluirlos en una tarea que no los toca.

## 11. Capacidades de Claude Code

- Agente: `.claude/agents/code-reviewer.md` — revisión de cambios antes de cerrar o abrir un PR.
- Skills en `.claude/skills/` (copias del Harness central; no editarlas acá, ver `~/.claude/HARNESS.md`): `harness-plan`, `harness-work`, `harness-review`, `chrome-devtools`, `design-loop`, `frontend-design`, `playwright-cli`, `skill-development`, `systematic-debugging`, `vercel-composition-patterns`, `vercel-react-best-practices`, `web-design-guidelines`. Usarlas cuando la tarea coincida con su descripción; su contenido no se duplica acá.

### Caveman (ahorro de tokens)

Caveman es un plugin de usuario (`caveman@caveman`, habilitado en `~/.claude/settings.json`), no parte del repo. Si está activo, comprime solo el estilo de las respuestas de chat: no el contenido. El reporte con evidencia (sección 6) sigue siendo obligatorio. Código, comandos, rutas, errores y todo lo que se escribe a disco (incluido este archivo, commits y documentación) van completos y en prosa normal. Las skills de proceso de Caveman (`surgical-patch`, `verify-and-stop`, `investigate-first`, etc.) se usan como apoyo, pero ante cualquier conflicto prevalece este contrato. No ejecutar `caveman-compress` sobre `CLAUDE.md`.

## 12. Intervención humana mínima

- Resolver de forma autónoma todo lo técnicamente posible. No pedir al usuario diagnósticos, comandos ni verificaciones que Claude pueda ejecutar.
- Pedir intervención solo cuando sea técnicamente inevitable: credenciales o cuentas externas, acciones de propietario del repo, decisiones de producto o acciones destructivas o irreversibles.
- Al pedirla, indicar qué se necesita, por qué es inevitable y qué se intentó antes.