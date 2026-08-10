# TICKET-033 — CodeRabbit Setup Guide

## Objetivo

CodeRabbit es un revisor de código impulsado por IA que se integra como GitHub App y analiza automáticamente cada Pull Request. Aporta:

- **Resúmenes automáticos** de alto nivel de los cambios.
- **Comentarios línea por línea** detectando bugs, code smells, tipos faltantes, problemas de rendimiento.
- **Chat interactivo** en el PR: los mantenedores pueden pedir aclaraciones o sugerencias con `@coderabbitai`.
- **Revisión en español** (configurado para el idioma del proyecto).
- **Cobertura automática** en cada push a PRs abiertos, ignorando drafts.

---

## Instalación

### 1. Instalar la GitHub App

1. Ir a **GitHub Marketplace → CodeRabbit** (https://github.com/marketplace/coderabbit).
2. Click **Install** → seleccionar la cuenta/organización **MarBlanco**.
3. Seleccionar **Only select repositories** → elegir **RegalarteWeb** (o *All repositories* si se prefiere).
4. Click **Install**.

> **Nota:** Solo el *owner* del repositorio (MarBlanco) puede instalar la GitHub App. Los colaboradores no tienen permisos para instalar GitHub Apps en la organización/repositorio.

### 2. Conectar al repositorio

Una vez instalada la App en la cuenta/organización, CodeRabbit detecta automáticamente los repositorios a los que tiene acceso. Si el repo **RegalarteWeb** está en la lista de repositorios autorizados, CodeRabbit comenzará a actuar en el siguiente PR que se abra.

### 3. Habilitar la configuración local

El repo ya incluye el archivo de configuración deshabilitado: `.coderabbit.yaml.disabled`.

Para activarlo, el owner debe renombrarlo:

```bash
git mv .coderabbit.yaml.disabled .coderabbit.yaml
git commit -m "chore(coderabbit): enable CodeRabbit configuration"
git push
```

> **Importante:** El archivo `.coderabbit.yaml` solo se lee **después** de instalar la GitHub App. Mientras la App no esté instalada, el archivo es ignorado por CodeRabbit.

---

## Configuración Recomendada

El archivo `.coderabbit.yaml` (actualmente `.coderabbit.yaml.disabled`) ya contiene la configuración recomendada para REGALARTE:

```yaml
reviews:
  summary: true           # Resumen de alto nivel en el PR
  comments: true          # Comentarios línea por línea
  language: es            # Revisiones en español
  auto_review:
    enabled: true         # Revisión automática en cada push
    drafts: false         # No revisar PRs en draft
  path_filters:
    - '!apps/web/src/payload-types.ts'   # Tipos generados
    - '!apps/web/src/migrations/**'       # Migraciones de BD
    - '!apps/web/src/app/(payload)/**'    # Admin de Payload
    - '!**/package-lock.json'             # Lockfile
    - '!**/*.md'                          # Documentación
  project_context: |
    Regalarte — Next.js 15 App Router + Payload CMS 3 + PostgreSQL ecommerce.
    Docs under docs/ are APPROVED + FROZEN source of truth.
    Commits follow: feat(scope): complete TICKET-0XX description.

chat:
  auto_reply: true      # Responder a @coderabbitai en comentarios
```

### Qué se revisa automáticamente

- Código de la aplicación (`apps/web/src/**` excepto filtros).
- Configuración de Next.js, Payload, TypeScript, ESLint.
- Cambios en esquemas de BD (migraciones, payload-types.ts se excluye por ser generado).

### Qué se excluye (y por qué)

| Ruta | Motivo |
|------|--------|
| `apps/web/src/payload-types.ts` | Tipos generados automáticamente por Payload |
| `apps/web/src/migrations/**` | Migraciones de BD versionadas |
| `apps/web/src/app/(payload)/**` | Panel admin de Payload (código de CMS) |
| `**/package-lock.json` | Lockfile de dependencias |
| `**/*.md` | Documentación (no código) |

---

## Flujo de Trabajo

### En Pull Requests

1. **Al abrir un PR:** CodeRabbit posta un resumen y comienza la revisión línea por línea.
2. **En cada push:** Re-revisión automática (incremental).
3. **Comentarios:** Aparecen como *review comments* en la pestaña *Files changed*.
4. **Chat:** Cualquier colaborador puede invocar a CodeRabbit en un comentario:
   ```
   @coderabbitai explica por qué este hook usa useEffect en lugar de useLayoutEffect
   @coderabbitai sugiere una forma más idiomática de tipar este hook
   ```
   CodeRabbit responde en el hilo del comentario.

### En Drafts

Los PRs marcados como **Draft** no se revisan automáticamente (`drafts: false`). Al marcar *Ready for review*, se dispara la revisión.

---

## Buenas Prácticas

### Cuándo aceptar sugerencias

- **Tipos faltantes** → Aceptar (mejora type safety).
- **Bugs reales** (off-by-one, null deref, race conditions) → Aceptar.
- **Code smells** (funciones largas, nesting excesivo) → Evaluar y refactorizar si aplica.
- **Convenciones de estilo** (comillas, imports) → Aceptar si son consistentes con el proyecto.

### Cuándo ignorar sugerencias

- **Falsos positivos** (CodeRabbit no conoce el contexto completo del dominio).
- **Sugerencias que rompen compatibilidad** con Payload/Next.js.
- **Preferencias subjetivas** sin impacto funcional (nombres de variables, etc.).
- **Cambios en archivos excluidos** (payload-types.ts, migraciones, docs).

### Mantener el criterio del equipo

- CodeRabbit **asiste**, no decide. El *merge* final requiere aprobación humana.
- Usar `@coderabbitai` para pedir segunda opinión, no para delegar decisiones.
- Si un patrón se repite como falso positivo, ajustar `path_filters` o `project_context`.

---

## Checklist

Lista rápida para verificar que CodeRabbit quedó correctamente instalado:

- [ ] **GitHub App instalada** en la cuenta/organización MarBlanco.
- [ ] **Repositorio RegalarteWeb** incluido en la instalación.
- [ ] Archivo renombrado: `.coderabbit.yaml.disabled` → `.coderabbit.yaml` (commit + push).
- [ ] **PR de prueba** abierto → verificar que CodeRabbit posta resumen y comentarios.
- [ ] Verificar que **drafts no se revisan** (abrir PR como draft, confirmar que no hay comentarios).
- [ ] Verificar que **path_filters funcionan** (cambiar `payload-types.ts`, confirmar que no comenta).
- [ ] Probar **chat**: comentar `@coderabbitai resume este PR` en un PR real.
- [ ] Verificar que **lenguaje** de respuestas es español.
- [ ] Documentar en el equipo: cómo invocar chat, cuándo aceptar/ignorar.

---

## Estado Actual

- ✅ Archivo de configuración preparado: `.coderabbit.yaml.disabled` (listo para renombrar).
- ⏳ **Pendiente:** Instalación de la GitHub App por el owner (MarBlanco).
- ⏳ **Pendiente:** Renombrar `.coderabbit.yaml.disabled` → `.coderabbit.yaml` tras instalar la App.
- ⏳ **Pendiente:** Verificación end-to-end con PR real.

---

## Referencias

- [CodeRabbit GitHub App](https://github.com/marketplace/coderabbit)
- [Documentación oficial](https://github.com/coderabbitai/ai-pr-reviewer)
- [Schema de configuración](https://coderabbit.ai/integrations/schema.v2.json)