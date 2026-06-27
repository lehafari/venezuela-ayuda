# Mejores prácticas de colaboración para un repo de emergencia con muchos contribuidores

> **Qué es esto.** Investigación profunda (multi-fuente, con verificación adversarial
> de afirmaciones) sobre cómo coordinar un repositorio GitHub que crece rápido y recibe
> contribuidores de **distintas áreas** y **niveles de confianza variados** (voluntarios
> abiertos + equipos técnicos por dominio). Está aterrizada a **este** proyecto:
> `venezuela-ayuda`, una app Next.js **en producción** para respuesta a emergencias,
> donde un error en prod tiene consecuencias reales.
>
> **Cómo usarla.** Las recomendaciones están priorizadas por impacto (P0 → P2). Los
> archivos accionables que las implementan ya están en el repo (ver
> [§7 Entregables](#7-entregables-archivos-listos)). Las afirmaciones citadas `[n]`
> remiten a [§8 Fuentes](#8-fuentes).

---

## 1. Resumen ejecutivo

Con muchos colaboradores, el repo no se rompe por falta de talento sino por **falta de
convenciones explícitas y barreras automáticas**. Tres palancas dan el 80 % del valor:

1. **Barreras automáticas en las ramas que tocan datos reales** (`main` = prod,
   `staging`). Protección de rama + CI obligatorio + revisión obligatoria. Los repos OSS
   grandes con protección de rama tienen ~el doble de contribuidores y bajaron el tiempo
   de revisión de PR de **1.084 → 178 min** tras activarla [11].
2. **Propiedad por dominio (CODEOWNERS)** para que cada PR lo revise quien sabe del área,
   sin que una sola persona sea cuello de botella [10][23][68].
3. **Gobernanza mínima escrita**: roles, cómo se entra, cómo se decide. Un modelo de
   gobernanza documentado **es** la infraestructura de onboarding: deja que un nuevo
   contribuya sin romper nada [16][17].

Y un cuarto, específico de este repo por su dolor ya vivido (el `0014` duplicado): **un
esquema de migraciones a prueba de colisiones** entre ramas concurrentes (§5).

> **Principio rector para un sistema en producción de emergencia:** *velocidad con
> frenos*. Optimizar para PRs pequeños y revisión rápida, pero **nunca** permitir push
> directo a `main`/`staging` ni saltarse el CI. La cautela en prod no es negociable.

---

## 2. Estrategia de ramas (recomendación)

**Adoptar formalmente el flujo que el repo ya usa de facto:** `feat/* → staging → main`,
con ramas de entorno protegidas y promoción **hacia arriba** vía PR [62][63].

```
feat/<área>/<descripción>  ──PR──▶  staging  ──PR──▶  main
   (trabajo)                       (DB staging)      (PROD)
```

- **`main` = producción.** Solo recibe merges desde `staging` vía PR. Nadie pushea
  directo (regla dura, incluidos admins) [9][63].
- **`staging` = preproducción** con su propia DB. Aquí se integra y se prueba contra
  datos no productivos antes de promover.
- **`feat/*` = ramas de trabajo cortas.** Una rama por unidad pequeña de cambio.

**Por qué este modelo y no GitFlow:** GitFlow (con `develop`, `release/*`, `hotfix/*`)
añade ceremonia que frena a voluntarios y no aporta a un producto de despliegue continuo.
La recomendación generalizada para equipos en GitHub es un **flujo ligero basado en ramas
+ PRs** (GitHub Flow), evitando forks para colaboradores regulares [64]. Este repo ya
está en esa línea; solo hay que **codificarlo y protegerlo**.

**Confianza mixta — forks vs ramas:**
- **Equipos/colaboradores de confianza:** ramas dentro del repo (más simple, CI con
  secretos) [64].
- **Voluntarios externos sin historial:** **fork + PR**. No se les da `write` hasta que
  demuestren compromiso (§6).

**PRs pequeños y enfocados.** Es la práctica de mayor retorno para escalar la revisión:
PRs chicos se revisan rápido, se rompen menos y reducen conflictos de merge. Un PR = un
cambio lógico.

➡️ Detalle operativo y reglas exactas: [`estrategia-de-ramas-y-proteccion.md`](./estrategia-de-ramas-y-proteccion.md).

---

## 3. Protección de ramas y revisión (P0)

Activar en `main` **y** `staging` (GitHub → Settings → Branches → Branch protection):

| Regla | Valor recomendado | Por qué |
|---|---|---|
| Require pull request before merging | ✅ | Cero commits directos a ramas de entorno [49][63]. |
| Required approving reviews | **`main`: 2 · `staging`: 1** | 1 aprobación es óptimo para la mayoría; 2 solo para lo de alto riesgo/PII para evitar "rubber-stamp" [6][8]. |
| Require review from Code Owners | ✅ | El dueño del dominio debe aprobar lo que toca su área [50][69]. |
| Require status checks to pass | ✅ (lint, build, test, **check-migrations**) | El CI es el gate de merge [51]. |
| Require branches up to date | ⚠️ Solo en `main` | "Strict" crea cola de merge y re-CI costoso en equipos veloces — útil en prod, caro en staging [10]. |
| Dismiss stale approvals on new commits | ✅ | Una aprobación no debe heredarse a código cambiado [52]. |
| Require conversation resolution | ✅ | No mergear con hilos abiertos [53]. |
| Block force pushes + Block deletions | ✅ | Las 2 protecciones más críticas junto con "aplicar a admins" [9]. |
| **Aplicar a administradores** | ✅ | Sin excepciones para admins — la tercera regla crítica [9]. |
| Require 2FA (a nivel org) | ✅ para todo el que tenga `write` | Protege contra credenciales comprometidas / supply chain [21]. |

**Realidad de adopción:** solo ~52 % de los 250 repos OSS más populares tienen protección
de rama [26] — pero los que la tienen escalan mejor (≈337 vs 184 contribuidores) y revisan
mucho más rápido [27][28]. Para un sistema en prod, esto es piso, no techo.

**Automatiza para no ser el cuello de botella:** linters/formatters en CI quitan de la
revisión humana todo lo mecánico (estilo, formato), dejando al revisor solo lo que importa
[11]. Cada check automático es una discusión que no tienes que tener en el PR.

---

## 4. Propiedad por dominio: CODEOWNERS (P0)

Un archivo `CODEOWNERS` asigna **equipos responsables por área**; combinado con "require
review from Code Owners", cada PR exige la aprobación de quien sabe del dominio que toca
[10][23][68]. Distribuye la propiedad y baja el bus factor sin perder calidad [24].

Dominios reales de este repo (→ ver [`.github/CODEOWNERS`](../../.github/CODEOWNERS)):

| Área | Rutas principales |
|---|---|
| Ingesta / Hub API | `src/app/api/`, `src/lib/{ingest,batchIngest,apiAuth,apiPolicy,partnerAuth,canonical,reports,internalWrite}.*`, `public/openapi.yaml` |
| Datos / Dedup | `src/lib/{dedup,data,csv,classifyHeuristic}.ts` |
| Reconocimiento facial | `src/lib/fr.ts` y vistas de registro |
| Admin / Moderación | `src/app/admin/`, `src/lib/{admin,audit}.*` |
| Mapa / UI pública | `src/app/{mapa,buscar,galeria,...}`, `src/lib/mapStyle.ts` |
| Base de datos | `supabase/`, `scripts/*migration*` |
| CI / Infra | `.github/` |

Notas de la mecánica que conviene conocer [10][70][71]:
- El `CODEOWNERS` se busca en `.github/`, raíz o `docs/`; gana el **primero** que exista.
- Precedencia: gana el **último patrón que haga match** (ordena de lo general a lo específico).
- Si un owner es un **equipo**, ese equipo debe ser visible y tener permiso `write`.
- CODEOWNERS aporta sobre todo en repos **grandes**; en uno chico añade overhead [7]. Este
  ya califica como grande/creciente.
- Trade-off real: acotar revisores hace las interacciones más profundas pero puede subir el
  tiempo entre interacciones [30] — mitígalo con varios miembros por equipo.

---

## 5. Migraciones de BD sin colisiones (P0 — dolor ya vivido aquí)

Este repo **ya sufrió** una colisión de numeración (`0014` para `collection_centers` y para
`api_partners` a la vez → hubo que renumerar a `0015`). Con muchos colaboradores en paralelo,
esto se vuelve crónico si no se ataca de raíz. La causa: dos ramas concurrentes crean cambios
de esquema y cada una toma el "siguiente número" → múltiples *heads* y fallos de despliegue
[31][45][54].

**Recomendación priorizada:**

1. **Numeración a prueba de colisiones.** Pasar de enteros secuenciales (`0021_…`) a
   **timestamp** (`YYYYMMDDHHMM_descripcion.sql`, p. ej. `202606271045_api_partners.sql`).
   Dos ramas distintas casi nunca generan el mismo timestamp → no hay colisión de archivo
   [58]. Nombres descriptivos en vez de ceros a la izquierda evitan el problema de Django
   [46].
   - *Alternativa si se quiere mantener el orden estricto:* un archivo de control versionado
     (estilo `max_migration.txt` de `django-linear-migrations`) que **fuerza un conflicto de
     merge en Git** cuando dos ramas añaden migración, obligando a resolución explícita en
     vez de un orden roto silencioso [54][55][56][57].

2. **Aplicación tolerante al orden.** El runner ya gatea por `applied_migrations` (cada una
   corre una vez). Asegurar que aplique **cualquier** migración pendiente sin importar su
   número (equivalente al *OutOfOrder* de Flyway), porque los contribuidores terminan en
   orden impredecible [59]. El orden solo importa **por objeto**: dos migraciones que tocan
   tablas distintas pueden correr en cualquier orden; solo las que tocan la *misma* tabla
   deben ordenarse [47].

3. **Cada migración, independiente y reversible-segura.** Una migración no debe dejar el
   esquema en estado roto si se libera sola [60]. Para cambios destructivos en prod usar el
   patrón **expand → migrate → contract** (añadir lo nuevo; migrar el código; en una
   migración *posterior* eliminar lo viejo) → cero downtime [35].

4. **CI que prueba el historial completo.** Un job que crea una **DB vacía y aplica todas
   las migraciones en orden** detecta heads rotos antes del merge [32]. Sumar **lint de
   migraciones** (estilo Squawk) que marca operaciones riesgosas, p. ej. agregar columna con
   `DEFAULT` que bloquea la tabla [36].

5. **Lock timeout en prod.** Fijar `lock_timeout` dentro de la migración: ante bloqueo,
   falla la migración en vez de tumbar la base [38].

> **Caveats honestos (afirmaciones que la verificación *refutó*):**
> - Un checklist manual en la plantilla de PR **no "obliga"** a cumplir buenas prácticas de
>   migración; es un recordatorio útil pero **no un control que se haga cumplir solo** —
>   confía en gates automáticos, no en checklists [refutado].
> - Git **no** detecta de forma fiable conflictos cuando dos ramas modifican el *mismo
>   objeto* de BD por archivos distintos; por eso hace falta el archivo de control del punto
>   1, no asumir que el merge de Git te salva [refutado].

➡️ Playbook operativo: [`gestion-de-migraciones.md`](./gestion-de-migraciones.md).

---

## 6. Gobernanza: roles, ingreso y decisiones (P1)

La gobernanza es el conjunto de reglas de **quién hace qué, cómo y cuándo** — no es solo
proceso técnico [18]. Debe estar **escrita** y **reflejar cómo opera el proyecto de verdad**
(exagerar la madurez genera fricción) [19].

**Modelo de roles recomendado (mínimo viable)** [16][20][41]:

| Rol | Puede | Cómo se obtiene |
|---|---|---|
| **Contributor** | Abrir issues y PRs (vía fork o rama) | Cualquiera |
| **Triager** | Etiquetar, cerrar/mover issues, pedir cambios — **sin** `write` a código | Se otorga liberalmente para descargar a los maintainers [22] |
| **Code Owner (por dominio)** | Revisar/aprobar PRs de su área | Compromiso sostenido en ese dominio |
| **Maintainer** | Merge a `staging`/`main`, gestionar releases | Confianza y alineación con la dirección del proyecto, **más** que skill puro [14] |

- **Permisos a equipos, no a personas**; y **mínimo 2 personas con rol owner** de la org
  (bus factor) [67][24].
- **Política de acceso a commit explícita:** para un repo en prod, restringir `write` a
  quienes demostraron compromiso, no a todo el que aporta una vez [43].
- **Voluntarios y pagados se juzgan por mérito técnico**, sin trato especial [44].
- **Modelo de decisión:** elegir uno y escribirlo — BDFL, meritocracia (voto de
  contribuidores activos), o *liberal contribution* (consenso) [40]. Para un proyecto de
  emergencia con un núcleo pequeño, BDFL/meritocracia híbrido suele ser lo más ágil.
- **Conflictos:** documentar el razonamiento de las decisiones y usar procesos con
  "cooling-off"; la mayoría de las disputas son sobre *procesos*, no sobre lo técnico [13-gov].
- **Escalar la revisión:** delegar en equipos pequeños y enfocados en vez de concentrar
  todo en una persona [12]; considerar un *community manager* (aunque sea voluntario) para
  dar la bienvenida y moderar [25].

**Onboarding como infraestructura** [17][66]:
- `README`, `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md` presentes y al día.
- Issues etiquetados `good first issue` para puntos de entrada.
- Un documento guía compartido (estilo "Team Compass") + plantillas reducen la fatiga de
  decisión de gente distribuida [15].

**ADRs (Architecture Decision Records)** [2]:
- Una decisión por ADR; conciso; en una ubicación central accesible a todos [2-multi].
- Cuando un ADR reemplaza a otro, enlázalos para mantener trazabilidad.
- Aprobar un ADR es esfuerzo de equipo: el autor resuelve todos los comentarios.
- (Este repo-hermano ya tiene cultura de ADR en `venezuela-ayuda-hub-api/docs/adr/` —
  reusar el formato.)

---

## 7. Entregables (archivos listos)

Implementan lo anterior; ya están en el repo:

| Archivo | Qué resuelve |
|---|---|
| [`CONTRIBUTING.md`](../../CONTRIBUTING.md) | Onboarding + flujo de trabajo + reglas de oro de prod |
| [`.github/CODEOWNERS`](../../.github/CODEOWNERS) | Propiedad por dominio (§4) |
| [`.github/pull_request_template.md`](../../.github/pull_request_template.md) | PR pequeño, checklist (incl. migraciones) |
| [`.github/ISSUE_TEMPLATE/`](../../.github/ISSUE_TEMPLATE/) | Issue forms (bug / feature) + config |
| [`.github/labels.yml`](../../.github/labels.yml) + [`workflows/labels.yml`](../../.github/workflows/labels.yml) | Taxonomía de labels + sync |
| [`estrategia-de-ramas-y-proteccion.md`](./estrategia-de-ramas-y-proteccion.md) | Modelo de ramas + reglas exactas de protección (§2-3) |
| [`gestion-de-migraciones.md`](./gestion-de-migraciones.md) | Playbook anti-colisión de migraciones (§5) |
| [`gestion-de-issues.md`](./gestion-de-issues.md) | Triage, labels, ciclo de vida, project board |
| [`gobernanza.md`](./gobernanza.md) | Roles, ingreso, decisiones, ADRs (§6) |

---

## 8. Fuentes

Verificadas con extracción de afirmaciones + verificación adversarial (2 de 25
afirmaciones verificadas fueron refutadas y están marcadas arriba como caveats).

1. GitHub Blog — *Elevating open source contributors to maintainers* — github.blog
2. AWS Architecture Blog — *Master ADRs: best practices* — aws.amazon.com
3. Defacto — *Database schema migrations* — getdefacto.com
4. Open Source Guides — *Leadership and Governance* — opensource.guide
5. CNCF — *Governance best practices* — contribute.cncf.io
6. `adamchainz/django-linear-migrations` — github.com
7. E. Feng — *Database migrations across git branches* — ehfeng.com
8. Ben Balter — *Open source governance* — ben.balter.com
9. LowlyDBA — *Flyway tips and tricks* — lowlydba.com
10. GitHub Docs — *About code owners* — docs.github.com
11. Arnica — *How top open source projects protect their code* — arnica.io
12. GitHub Docs — *Managing a branch protection rule* — docs.github.com
13. M. Grinberg — *Resolving database schema conflicts* — blog.miguelgrinberg.com
14. McGinnis — *GitHub branch protection deep dive* — mcginniscommawill.com
15. CA.gov Web Standards — *GitHub best practices* — webstandards.ca.gov

_Stats de la investigación: 3 ángulos · 15 fuentes leídas · 71 afirmaciones extraídas ·
25 verificadas adversarialmente · 23 confirmadas · 2 refutadas._
