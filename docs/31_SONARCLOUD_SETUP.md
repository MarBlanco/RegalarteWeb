# TICKET-034 — SonarCloud Setup Guide

## Objetivo

SonarCloud es una plataforma de análisis estático de código en la nube que detecta automáticamente:

- **Bugs** (errores reales que causan fallos en producción)
- **Vulnerabilidades de seguridad** (inyección SQL, XSS, secrets hardcodeados)
- **Code smells** (código difícil de mantener, duplicado, demasiado complejo)
- **Duplicación de código**
- **Cobertura de tests** (cuando se configura)
- **Security hotspots** (código que requiere revisión manual de seguridad)

Se integra con GitHub Actions para analizar cada PR y push a `main`, y publica el resultado como comentario en el PR con el **Quality Gate** (pasa/no pasa).

---

## Cómo Conectar GitHub

### 1. Crear cuenta en SonarCloud

1. Ir a https://sonarcloud.io
2. Click **Sign in with GitHub**
3. Autorizar a SonarCloud para acceder a la organización **MarBlanco**

### 2. Importar el proyecto

1. En el dashboard de SonarCloud, click **Analyze new project**
2. Seleccionar **GitHub** como proveedor
3. Buscar y seleccionar **MarBlanco/RegalarteWeb**
3. Click **Set up**

### 3. Configurar organización y project key

En la pantalla de configuración del proyecto, anotar:
- **Organization key:** `marblanco` (debe coincidir con `sonar.organization` en `sonar-project.properties`)
- **Project key:** `MarBlanco_RegalarteWeb` (debe coincidir con `sonar.projectKey`)

> **Importante:** Estos valores ya están configurados en `sonar-project.properties` en la raíz del repo. Verificar que coincidan exactamente.

---

## Cómo Obtener el Token

1. En SonarCloud, ir a **My Account > Security**
2. Click **Generate Tokens**
3. Nombre: `GitHub Actions - RegalarteWeb`
4. Tipo: **Global analysis token** (o *Project analysis token* si se prefiere por proyecto)
3. Click **Generate**
4. **Copiar el token inmediatamente** (no se volverá a mostrar)

---

## Cómo Agregar el Token a GitHub Secrets

1. En GitHub, ir al repo **MarBlanco/RegalarteWeb**
2. **Settings > Secrets and variables > Actions**
3. Click **New repository secret**
4. Name: `SONAR_TOKEN`
5. Secret: *pegar el token copiado*
3. Click **Add secret**

> **Nota:** El workflow ya está preparado (`.github/workflows/sonarcloud.yml.disabled`) y espera este secret con el nombre exacto `SONAR_TOKEN`.

---

## Cómo Habilitar el Análisis Automático

El workflow ya existe en el repo pero está deshabilitado: `.github/workflows/sonarcloud.yml.disabled`.

Para habilitarlo:

```bash
git mv .github/workflows/sonarcloud.yml.disabled .github/workflows/sonarcloud.yml
git commit -m "ci(sonarcloud): enable SonarCloud workflow"
git push
```

### Qué hace el workflow

- **Trigger:** En cada `push` a `main` y en cada `pull_request` hacia `main`
- **Fetch depth 0:** Necesario para que SonarCloud pueda asignar issues a commits/blame
- **Acción:** `SonarSource/sonarcloud-github-action@v3.1.0`
- **Secrets requeridos:** `GITHUB_TOKEN` (automático) y `SONAR_TOKEN` (secreto manual)
- **Publica:** Comentario en el PR con resultado del Quality Gate y lista de issues

---

## Qué Métricas Analizará

| Categoría | Qué mide | Umbral Quality Gate (recomendado) |
|-----------|----------|-----------------------------------|
| **Bugs** | Errores que causan fallos | 0 bugs nuevos |
| **Vulnerabilities** | Fallos de seguridad | 0 vulnerabilidades nuevas |
| **Security Hotspots** | Código que requiere revisión manual | 0 hotspots no revisados |
| **Code Smells** | Mantenibilidad, legibilidad | ≤ 5 nuevos code smells |
| **Duplication** | Código duplicado | < 3% en código nuevo |
| **Coverage** | % de código cubierto por tests | ≥ 80% (cuando se configure) |
| **Maintainability Rating** | Índice de mantenibilidad | A (≤ 5% deuda técnica) |
| **Reliability Rating** | Fiabilidad | A (0 bugs) |
| **Security Rating** | Seguridad | A (0 vulnerabilidades) |

---

## Qué es un Quality Gate

El **Quality Gate** es un conjunto de condiciones que debe cumplir el código para considerarse "listo para producción". Si alguna condición falla, el Quality Gate **falla** y el PR muestra estado **Failed** en SonarCloud.

Ejemplo de Quality Gate recomendado para REGALARTE:

```
✅ No new bugs
✅ No new vulnerabilities  
✅ No new security hotspots (unreviewed)
✅ New code coverage ≥ 80% (cuando exista test runner)
✅ Duplicated lines on new code < 3%
✅ Maintainability rating ≥ A
```

Si el Quality Gate falla, el PR no debe mergearse hasta resolver los issues.

---

## Cómo Integrar con GitHub Actions

El workflow ya existe deshabilitado: `.github/workflows/sonarcloud.yml.disabled`.

Para activarlo:

```bash
git mv .github/workflows/sonarcloud.yml.disabled .github/workflows/sonarcloud.yml
git commit -m "ci(sonarcloud): enable SonarCloud workflow"
git push
```

El workflow se ejecutará automáticamente en:
- Push a `main`
- Pull Requests hacia `main`

Publicará un comentario en el PR con:
- Estado del Quality Gate (Passed/Failed)
- Resumen de nuevos issues (bugs, vulnerabilities, code smells)
- Enlace al dashboard de SonarCloud para detalles

---

## Qué Métricas Analizará (detalle)

### En código TypeScript/TSX
- **Bugs:** null checks, off-by-one, infinite loops, etc.
- **Security:** XSS, SQL injection, path traversal, secrets
- **Code smells:** cognitive complexity, duplicated blocks, unused variables
- **Type safety:** uso de `any`, missing return types, unsafe casts

### Excluidos del análisis (configurado en `sonar-project.properties`)
| Patrón | Motivo |
|--------|--------|
| `**/node_modules/**` | Dependencias externas |
| `**/dist/**`, `**/.next/**`, `**/build/**` | Build artifacts |
| `apps/web/src/payload-types.ts` | Tipos generados por Payload |
| `apps/web/src/migrations/**` | Migraciones de BD versionadas |
| `apps/web/src/app/(payload)/**` | Admin de Payload CMS |
| `apps/web/src/app/api/**` | API routes (se revisan en CI separado) |
| `**/*.d.ts` | Declaration files |

---

## Checklist Final de Instalación

- [ ] **Cuenta SonarCloud** creada y vinculada a GitHub (MarBlanco)
- [ ] **Proyecto importado** en SonarCloud (MarBlanco/RegalarteWeb)
- [ ] **Organization key** y **Project key** coinciden con `sonar-project.properties`
- [ ] **Token generado** en SonarCloud (My Account > Security)
- [ ] **Secret `SONAR_TOKEN`** agregado en GitHub (Settings > Secrets > Actions)
- [ ] **Workflow habilitado**: `git mv sonarcloud.yml.disabled sonarcloud.yml`
- [ ] **Push a main** → verificar que el workflow corre en Actions
- [ ] **PR de prueba** abierto → verificar comentario de SonarCloud con Quality Gate
- [ ] **Quality Gate configurado** en SonarCloud (Project Settings > Quality Gates)
- [ ] **Verificar PR de prueba**: Quality Gate pasa/falla correctamente
- [ ] **Configurar notificaciones** (opcional): email/Slack en fallos de Quality Gate

---

## Referencias

- [SonarCloud Documentation](https://sonarcloud.io/documentation)
- [SonarCloud GitHub Action](https://github.com/SonarSource/sonarcloud-github-action)
- [Quality Gates](https://docs.sonarcloud.io/quality-gates/)
- [SonarCloud Token](https://docs.sonarcloud.io/advanced/tokens/)