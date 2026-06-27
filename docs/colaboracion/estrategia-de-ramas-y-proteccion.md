# Estrategia de ramas y protección

Modelo operativo de ramas y la configuración **exacta** de protección a aplicar en GitHub.
Fundamento y fuentes: [`00-mejores-practicas-colaboracion.md`](./00-mejores-practicas-colaboracion.md) §2–3.

## El modelo: `feat → staging → main`

```
feat/<área>/<descripción>  ──PR──▶  staging  ──PR (solo maintainers)──▶  main
        trabajo                    DB de staging                         PRODUCCIÓN
```

- **`main`** = producción. Cada push dispara `apply-migrations.yml` contra la **DB de prod**.
  Solo entra vía PR de promoción desde `staging`, **y tras pasar QA** (ver abajo).
- **`staging`** = preproducción con **DB propia**. Integración, **QA** y prueba real antes de prod.
- **`feat/*`** = ramas de trabajo cortas. Se ramifican desde `staging`. Nacen de un **issue
  asignado** (el issue es el punto de entrada — ver [`gestion-de-issues.md`](./gestion-de-issues.md)).

### QA en staging (gate antes de `main`)

Nada llega a producción sin pasar QA en staging. **Modelo mixto:**
- **Por PR:** al mergear a `staging`, un responsable de QA valida ese cambio en el entorno de
  staging.
- **Ronda integrada:** antes de cada promoción `staging → main`, QA verifica el **conjunto**
  acumulado (que los cambios no se rompan entre sí).

**Responsables de QA/testing en staging:** **@mawmawmaw/equipo-qa** _(reemplazar por los
@handles reales)_. Su aprobación es **requisito** para el PR de promoción a `main`. Un bug
hallado en QA → issue + `status:blocked` si frena la promoción.

Por qué este modelo (no GitFlow): despliegue continuo + voluntarios = flujo ligero basado en
ramas y PRs; la promoción por entornos con merge hacia arriba garantiza ascensos limpios.

### Convención de nombres de rama

```
<tipo>/<área>/<descripción-corta-en-kebab>
```
- **tipo:** `feat` · `fix` · `docs` · `chore` · `refactor`
- **área:** `ingesta` · `dedup` · `fr` · `admin` · `mapa` · `db` · `ci` · `ui`
- Ej.: `feat/ingesta/rechazar-request-sin-coords`, `fix/dedup/personkey-geocell`

### PRs pequeños

Un PR = un cambio lógico. Beneficio: revisión rápida, menos bugs, menos conflictos de merge.
Si un PR no se puede revisar en ~10 minutos, pártelo.

## Configuración de protección de ramas

GitHub → **Settings → Branches → Add branch ruleset** (o Branch protection rule). Aplicar a
`main` **y** `staging` con estas diferencias:

| Regla | `main` (prod) | `staging` |
|---|---|---|
| Require a pull request before merging | ✅ | ✅ |
| → Required approving reviews | **2** | **1** |
| → Dismiss stale approvals on new commits | ✅ | ✅ |
| → Require review from Code Owners | ✅ | ✅ |
| → Require conversation resolution | ✅ | ✅ |
| Require status checks to pass | ✅ | ✅ |
| → Checks requeridos | `lint`, `build`, `test`, `Check migrations applied` | igual |
| → Require branches up to date before merging | ✅ | ➖ (opcional) |
| Require linear history | ✅ (recomendado) | ➖ |
| Block force pushes | ✅ | ✅ |
| Block deletions | ✅ | ✅ |
| Do not allow bypassing (incluye admins) | ✅ | ✅ |
| Restrict who can push | solo maintainers (merge) | equipos con write |

A nivel **organización** (Settings → Authentication security):
- **Require two-factor authentication** para todos los miembros con acceso de escritura.
- Permisos asignados a **equipos**, no a personas. Mínimo **2 owners** de la org.

### Notas y trade-offs

- *Require branches up to date* ("strict") crea una cola de merge: cada merge obliga al resto
  a rebasar y re-correr CI. Vale la pena en `main` (prod), pero en `staging` puede frenar a un
  equipo veloz — déjalo opcional ahí.
- *2 aprobaciones* solo en `main`. En el resto, 1 es lo óptimo: pedir 2 en todo suele degenerar
  en "rubber-stamping".
- *Dismiss stale approvals*: evita que una aprobación vieja valide código que cambió después.
- Las 3 protecciones más críticas: **no force-push, no borrar la rama, y aplicar las reglas
  también a admins.**

## Checks de CI requeridos (gate de merge)

El repo ya tiene workflows; conéctalos como checks requeridos:
- **`Check migrations applied`** (`check-migrations.yml`) — branch-aware (PR a `staging` valida
  DB staging; a `main`, prod).
- **lint / build / test** — añadir un workflow `ci.yml` si no existe que corra
  `npm run lint`, `npm run build` y `node --test` en cada PR.

> Regla de oro: si un check falla, **no se mergea**. No se usan bypass ni `--no-verify`.

## Hotfix a producción

Para un fix urgente que no puede esperar el ciclo por `staging`:
1. Rama `fix/...` desde `main`.
2. PR directo a `main` con **2 aprobaciones** (incluido un maintainer) y CI verde.
3. Inmediatamente después, **back-merge `main → staging`** para que no se pierda el fix.

Reservar este camino solo para incidentes reales de producción.
