# TICKET-030 — Blocker Report

## Ticket

TICKET-030 — Observabilidad.

Responsable: MANCHY.
Estado: 🚫 BLOQUEADO — falta spec aprobada de observabilidad.

## Resumen

TICKET-030 no puede implementarse porque la documentación aprobada no
define ninguna especificación de observabilidad para la V1. No existe
definición de qué métricas, logs, trazas o alertas se requieren, ni qué
herramientas o proveedores se usarán. Toda implementación razonable
requeriría inventar arquitectura o decisiones operativas no aprobadas.

## Qué existe hoy

El proyecto **no tiene ningún componente de observabilidad** implementado:

- **Logs**: Solo `console.log`/`console.error` en código. No hay
  estructuración (JSON), niveles, correlación de requests, ni agregación
  centralizada.
- **Métricas**: No hay exposición de métricas (Prometheus, OpenTelemetry,
  custom). No hay dashboards.
- **Trazas**: No hay instrumentación de tracing distribuido (OpenTelemetry,
  Jaeger, Zipkin).
- **Alertas**: No hay reglas de alerta, canales de notificación, ni
  escalation policies.
- **Health checks**: No hay endpoints de liveness/readiness/startup.

## Qué dice la documentación aprobada

Se auditaron `docs/` (00–22, BUILD_STATUS, IMPLEMENTATION_ROADMAP,
PROJECT_CONTEXT, SPRINTS, README, knowledge/) y **no hay ninguna
especificación de observabilidad**:

- `SPRINTS.md` (línea 297), Sprint 11 HARDENING: entregable
  "Monitoring" como único item. **No define qué es monitoring**, qué
  métricas, qué herramienta, qué SLOs.
- `BUILD_STATUS.md` (línea 209), Hardening: mismo item "Monitoring" sin
  detalle.
- `IMPLEMENTATION_ROADMAP.md` (línea 226): idem.
- Búsqueda de `Observabilidad|observability|Sentry|Datadog|New
  Relic|OpenTelemetry|logs|métricas|metrics|tracing|alerting|health
  check|SLO|SLI` en todos los docs: **0 resultados** con contenido
  accionable.
- El ticket `TICKET-030` no figura en ninguna documentación (0
  resultados en todo el repo); aparece únicamente en `WORKING.md` como
  parte del bloque Sprint 6 — Hardening.

## Por qué no se puede implementar

El ticket pide implementar observabilidad para la V1. Toda alternativa
razonable requiere inventar infraestructura o decisiones no aprobadas:

| Opción | Problema |
|---|---|
| Integrar Sentry / Datadog / New Relic | Inventa servicio externo — prohibido ("No agregar servicios externos") |
| OpenTelemetry + collector + backend | Inventa arquitectura de observabilidad completa sin spec |
| Logs estructurados + Loki/Grafana | Inventa stack de logging sin spec ni proveedor aprobado |
| Métricas Prometheus + Grafana | Inventa stack de métricas sin spec |
| Health checks Kubernetes | Inventa infraestructura de despliegue no aprobada |
| Definir SLOs/SLIs y alertas | Implica decisiones de negocio (disponibilidad, latencia) sin spec |

Ninguna salida es implementable sin violar "No inventar infraestructura",
"No agregar servicios externos" ni "No agregar dependencias".

## Recomendación

Antes de reabrir TICKET-030, definir y aprobar en la documentación fuente
(PRD / System Architecture / Technical Architecture / Infrastructure):

1. Qué proveedor/herramienta de observabilidad se usa (¿Sentry?
   ¿Datadog? ¿OpenTelemetry self-hosted? ¿Cloud provider?).
2. Qué se observa: logs, métricas, trazas, health checks, uptime.
3. Qué SLOs/SLIs se comprometen (disponibilidad, latencia p95/p99,
   error rate).
4. Qué alertas críticas y canales de notificación (Slack, PagerDuty,
   email).
5. Presupuesto y coste operativo aprobado.
6. Si la V1 requiere observabilidad completa o solo health checks básicos.

Solo entonces reabrir TICKET-030 con spec aprobada.

## Estado

Sin código modificado. Sin dependencias nuevas. Sin migraciones. Sin
cambios de arquitectura. Branch `feature/ticket-030-observability` creado
únicamente para alojar este reporte y permitir trazabilidad de la
decisión.