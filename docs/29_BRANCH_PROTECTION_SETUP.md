# Branch Protection Setup — Guía Operativa

## Objetivo

Proteger la rama `main` para garantizar que todo cambio pase por revisión de código y validaciones automáticas (CI) antes de integrarse. Esto previene:

- Pushes directos que rompen el build
- Código sin revisión que introduce bugs
- Merge de PRs con checks fallando
- Pérdida de trazabilidad de cambios

---

## Configuración Recomendada

### Branch Protection

**Branch:** `main`

### Requerir Pull Request

- **Require a pull request before merging** ✅ Habilitado
  - **Required approvals:** 1 (recomendado para proyecto individual/equipo pequeño)
  - **Dismiss stale approvals** ✅ Habilitado (cuando se empujan nuevos commits)
  - **Require review from Code Owners** ❌ No aplica (no hay CODEOWNERS definido)

### Status Checks

**Require status checks to pass before merging** ✅ Habilitado

Status checks obligatorios (deben aparecer en verde antes de permitir merge):

| Check | Descripción | Origen |
|-------|-------------|--------|
| **Continuous Integration** | Build, Lint, Typecheck | GitHub Actions (workflow `CI`) |
| **Analyze (CodeQL)** | Análisis de seguridad SAST | GitHub CodeQL |
| **SonarCloud** | Quality Gate (calidad, bugs, vulnerabilidades) | SonarCloud (cuando exista) |
| **CodeRabbit** | Revisión automática de código | CodeRabbit (cuando exista) |

> **Nota:** Solo `Continuous Integration` y `Analyze (CodeQL)` están activos hoy. `SonarCloud` y `CodeRabbit` se agregarán cuando se implementen (TICKET-033, TICKET-034).

### Requerir rama actualizada

**Require branches to be up to date before merging** ✅ Habilitado

- **Cuándo activar:** Siempre. Fuerza al autor a hacer rebase/merge de `main` antes de mergear, evitando conflictos y asegurando que los checks corren sobre la versión más reciente.

### Conversaciones

**Require conversation resolution before merging** ✅ Habilitado

- Impide merge si quedan hilos de revisión sin resolver. Fuerza a responder comentarios antes de integrar.

### Push directo

**Allow force pushes** ❌ Deshabilitado

- Bloquea `git push --force` y `git push --force-with-lease` sobre `main`.

**Allow deletions** ❌ Deshabilitado

- Impide `git push origin --delete main`.

### Administradores

**Include administrators** ⚠️ Recomendación para proyectos individuales/equipo pequeño: **No habilitado**

- Si se habilita, los admins también deben pasar por PR y checks. En proyectos pequeños puede ser demasiado restrictivo para hotfixes urgentes. Evaluar según madurez del equipo.

### Auto Merge

**Allow auto-merge** ✅ Habilitado

- Permite activar "Auto-merge" en PRs. El merge ocurre automáticamente cuando todos los checks pasan y hay aprobaciones. Útil para PRs triviales (docs, dependencias).

### Auto Delete Branch

**Automatically delete head branches** ✅ Habilitado

- Limpia la rama remota tras merge. Mantiene el repo limpio.

---

## Checklist

Lista rápida para verificar que la configuración quedó correctamente aplicada en GitHub Settings > Branches > Branch protection rules > `main`:

- [ ] **Branch name pattern:** `main`
- [ ] **Require a pull request before merging** ✅
  - [ ] Required approvals: `1`
  - [ ] Dismiss stale approvals ✅
  - [ ] Require review from Code Owners ❌ (N/A)
- [ ] **Require status checks to pass before merging** ✅
  - [ ] Continuous Integration ✅
  - [ ] Analyze (CodeQL) ✅
  - [ ] SonarCloud ✅ (cuando exista)
  - [ ] CodeRabbit ✅ (cuando exista)
- [ ] **Require branches to be up to date before merging** ✅
- [ ] **Require conversation resolution before merging** ✅
- [ ] **Require signed commits** ❌ (opcional, no requerido hoy)
- [ ] **Require linear history** ❌ (opcional, permite merge commits)
- [ ] **Allow force pushes** ❌
- [ ] **Allow deletions** ❌
- [ ] **Include administrators** ❌ (evaluar según equipo)
- [ ] **Allow auto-merge** ✅
- [ ] **Automatically delete head branches** ✅

---

## Cómo aplicar

1. Ir a **GitHub > Settings > Branches**
2. En "Branch protection rules" → **Add rule**
3. Branch name pattern: `main`
3. Marcar cada checkbox según la tabla anterior
4. En "Status checks that are required" → buscar y agregar cada check por nombre exacto (ej: `Continuous Integration`, `Analyze (TypeScript/JS)`, etc.)
5. **Save changes**

> **Nota:** Los checks aparecen en la lista después de que corran al menos una vez en un PR contra `main`. Si no aparecen, crear un PR de prueba, esperar a que corran, luego configurar la regla.

---

## Verificación post-configuración

1. Crear un PR de prueba (rama temporal → `main`)
2. Verificar que:
   - No permite merge hasta que todos los checks estén verdes
   - No permite merge sin aprobación
   - No permite push directo a `main`
   - Auto-merge funciona si se activa
   - Rama se borra tras merge (si auto-delete habilitado)
5. Borrar rama de prueba