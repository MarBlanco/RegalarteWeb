# TICKET-031 — Blocker Report

## Ticket

TICKET-031 — Backups y recuperación.

Responsable: Martín.
Estado: 🚫 BLOQUEADO — falta spec aprobada de estrategia de backups.

## Resumen

TICKET-031 no puede implementarse porque la documentación aprobada no
define ninguna estrategia de backups ni recuperación para la V1. No existe
spec de RPO/RTO, ni procedimiento de restauración, ni dónde/alojamiento de
backups, ni qué infraestructura de PostgreSQL de producción se respalda.
Toda implementación razonable requeriría inventar infraestructura o
decisiones operativas no aprobadas.

## Qué existe hoy

La base actual del proyecto **no tiene nada de backup/restore**:

- **PostgreSQL**: único dato es `DATABASE_URI` en `.env.example`
  (`postgresql://regalarte_user:regalarte_pass@localhost:5432/regalarte_db`),
  un valor local de desarrollo. No hay un hosting/proveedor de PostgreSQL
  de producción aprobado (ni Neon, ni Supabase, ni RDS, ni managed Postgres).
- **Cloudflare R2**: en `BUILD_STATUS.md` está marcado como `[ ] Cloudflare R2`
  (pendiente). El plugin `s3Storage` en `payload.config.ts` solo se activa si
  `R2_ACCESS_KEY_ID` existe y no es placeholder. R2 se usa (cuando esté
  configurado) para media de Payload, **no** como destino de backups.
- **Scripts**: no existe ningún script de backup/restore (`*.sh`, `*.ps1`,
  `*.sql`, `pg_dump`, `docker`). Búsqueda en el repo: 0 resultados.
- **Configuración de despliegue**: no hay Dockerfile, docker-compose, ni
  config de hosting. Solo CI (`.github/workflows/ci.yml`, `codeql.yml`),
  dependabot y codeql-config.

## Qué dice la documentación aprobada

Se auditaron `docs/` (00–22, BUILD_STATUS, IMPLEMENTATION_ROADMAP,
PROJECT_CONTEXT, SPRINTS, README, knowledge/) y **no hay ninguna definición
de backups o recuperación**:

- `SPRINTS.md` (líneas 283–307), SPRINT Hardening: entregables son Testing,
  Accessibility, Security, Performance, Monitoring. **No menciona backups.**
- `BUILD_STATUS.md` (líneas 197–213), Hardening: mismo set de items. **No
  menciona backups.**
- `docs/04_TECHNICAL_ARCHITECTURE.md`: lista PostgreSQL y Cloudflare R2 como
  parte del stack técnico, pero no define backup, replica, snapshot ni
  recuperación.
- `docs/13_DATABASE_DESIGN.md` / `13B_DATABASE_DESIGN_REVIEW.md`: diseño de
  entidades y relaciones, sin estrategia de persistencia/recuperación.
- Búsqueda de `backup|restore|respaldo|recuperación|dump|pg_dump|RPO|RTO|snapshot`
  en todos los docs: **0 resultados**.
- El ticket `TICKET-031` no figura en ninguna documentación (0 resultados en
  todo el repo); aparece únicamente en `WORKING.md` como parte del bloque
  Sprint 6 — Hardening.

## Por qué no se puede implementar

El ticket pide "auditar la estrategia de backups y recuperación e implementar
aquello que corresponda para la V1". Toda alternativa razonable requiere
inventar infraestructura o decisiones no aprobadas:

| Opción | Problema |
|---|---|
| Script `pg_dump`/restore de PostgreSQL | No hay PostgreSQL de producción definido; un script local apunta a la DB de dev |
| Backup de Cloudflare R2 | R2 no está configurado (BUILD_STATUS `[ ]`) y no es destino de backups en la V1 |
| Cron/scheduler de backups | Requiere infraestructura de scheduling no aprobada y hosting definido |
| Documentar RPO/RTO y procedimiento de restore | Implica definir SLA y decisiones operativas sin spec aprobada |
| Backups gestionados (Neon/Supabase/RDS) | Inventa servicios externos — prohibido por el ticket ("No agregar servicios externos") |
| Docker para la DB | Inventa infraestructura de despliegue no aprobada |

Ninguna salida es implementable sin violar "No inventar infraestructura",
"No agregar servicios externos" ni "No agregar dependencias".

## Recomendación

Antes de reabrir TICKET-031, definir y aprobar en la documentación fuente
(PRD / System Architecture / Technical Architecture / Database Design):

1. Qué PostgreSQL de producción se usa (proveedor/hosting) — o si la V1
   mantiene PostgreSQL local/hasta despliegue.
2. Qué se respalda: solo PostgreSQL, o también media de R2.
3. Frecuencia y retención de backups (diario/semanal, cuántos días).
4. Objetivos de recuperación: RPO y RTO aceptables para la V1.
5. Dónde se almacenan los backups y quién accede.
6. Procedimiento de restauración validado (restore test).

Solo entonces reabrir TICKET-031 con spec aprobada.

## Estado

Sin código modificado. Sin dependencias nuevas. Sin migraciones. Sin
cambios de arquitectura. Branch `feature/ticket-031-backups` creado
únicamente para alojar este reporte y permitir trazabilidad de la decisión.
