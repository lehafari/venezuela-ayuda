# Mejores prácticas de colaboración para un repo de emergencia con muchos contribuidores

> **Qué es esto.** Investigación con **rigor verificado**: cada recomendación se ancla a una
> fuente primaria con **cita textual**, y cada afirmación pasó verificación adversarial de
> **3 votos** (sobrevive solo si menos de 2 de 3 escépticos la refutan). Aterrizada a **este**
> proyecto: `venezuela-ayuda`, app Next.js **en producción** para respuesta a una emergencia,
> donde un error en prod tiene consecuencias reales.
>
> **Metodología.** 2 pasadas, 13 ángulos de búsqueda, 44 URLs leídas, 234 afirmaciones
> extraídas, **115 verificadas y confirmadas** (0 refutadas en la corrida final), de **24
> fuentes** (23 primarias). Las citas `[n]` remiten a [§9 Fuentes](#9-fuentes). Marca de
> consenso: **[3/3]** = unánime · **[2/3]** = un escéptico discrepó (matiz, no rechazo).
>
> **Cómo usarla.** Recomendaciones priorizadas por impacto (P0 → P2). Los archivos que las
> implementan ya están en el repo (ver [§8 Entregables](#8-entregables)).

---

## 1. Resumen ejecutivo

Con muchos colaboradores, el repo no se rompe por falta de talento sino por **falta de
convenciones explícitas y barreras automáticas**. La evidencia apunta a cuatro palancas:

1. **Integración frecuente con ramas cortas.** Integrar seguido aumenta el número de merges
   pero *reduce* su complejidad y riesgo, y alerta antes de los conflictos [1]. Las ramas de
   feature deben durar **como mucho un par de días**; más allá hay riesgo de rama de larga
   vida [3]. Un cambio no está integrado hasta que se hace push a mainline [2].
2. **Barreras automáticas en las ramas que tocan datos reales** (`main`=prod, `staging`):
   protección de rama + CI obligatorio + revisión obligatoria [7][8].
3. **Propiedad por dominio (CODEOWNERS)** para que cada PR lo revise quien sabe del área, sin
   un único cuello de botella [6].
4. **Revisión rápida.** La velocidad de revisión del *equipo* importa más que la individual
   [4]; un estudio de Mozilla halló que recibir revisión **dentro de 48 h** elevó mucho la
   tasa de retorno de contribuidores [17].

Y una quinta, crítica para este repo por su dolor ya vivido (el `0014` duplicado): **un
esquema de migraciones a prueba de colisiones** entre ramas concurrentes (§5).

> **Principio rector para producción de emergencia:** *velocidad con frenos*. Optimizar PRs
> pequeños y revisión rápida, pero **nunca** permitir push directo a `main`/`staging` ni
> saltarse el CI. Dato sobrio: en respuesta a desastres, **quienes operan estos sistemas
> suelen ser voluntarios, no profesionales** (los mapas de Ushahidi en Haití, Chile y
> Pakistán los hicieron estudiantes voluntarios [21]) — razón de más para que las barreras
> las ponga el sistema, no la pericia individual.

---

## 2. Estrategia de ramas

**Adoptar formalmente el flujo que el repo ya usa de facto:** `feat/* → staging → main`, con
ramas de entorno protegidas y promoción **hacia arriba** vía PR.

```
feat/<área>/<descripción>  ──PR──▶  staging  ──PR (maintainers)──▶  main
        trabajo                    DB staging                       PRODUCCIÓN
```

Evidencia que lo respalda:
- **Ramas cortas, integración diaria.** En trunk-based las ramas viven horas y se integran a
  diario; se recomienda **≤3 ramas activas** y **merge a trunk al menos una vez al día**
  [1] **[3/3]**. Una feature branch no debería pasar de **dos días** [3] **[2/3]**.
- **Integrar seguido reduce riesgo.** "Frequent integration increases the frequency of merges
  but reduces their complexity and risk" [1] **[3/3]**.
- **Pocos autores por rama.** Una rama corta la trabaja **1 persona** (2 si hay pairing) [3]
  **[2/3]** — encaja con PRs pequeños.
- **Umbral de escala.** Con el branching liviano de Git moderno, el punto donde conviene pasar
  de "directo a trunk" a ramas cortas baja a ~15 personas [3] **[2/3]**: con un equipo
  creciente, ramas cortas + PR es lo correcto.

Por qué **no GitFlow**: añade ceremonia (`develop`, `release/*`) que frena a voluntarios sin
aportar a despliegue continuo. La recomendación es un flujo ligero basado en ramas + PRs; este
repo ya está ahí — solo hay que **codificarlo y protegerlo**.

**Confianza mixta — forks vs ramas:**
- **Equipos/colaboradores de confianza:** ramas dentro del repo.
- **Voluntarios externos sin historial:** **fork + PR**; el acceso `write` se gana (§6).

**PRs pequeños.** Es la práctica de mayor retorno para escalar la revisión. Google recomienda
acotar los cambios "pequeños" a **~200 líneas** [4] **[2/3]**. Un PR = un cambio lógico.

➡️ Detalle operativo y reglas exactas: [`estrategia-de-ramas-y-proteccion.md`](./estrategia-de-ramas-y-proteccion.md).

---

## 3. Protección de ramas y revisión (P0)

### Protección de ramas

Activar en `main` **y** `staging`. Lo que dice la documentación oficial de GitHub:

| Regla | Recom. | Respaldo |
|---|---|---|
| Require pull request before merging | ✅ | base del flujo [8] |
| Required approving reviews | `main`: 2 · `staging`: 1 | configurable por ruleset [7] **[3/3]** |
| Require review from Code Owners | ✅ | "require approval from a specific person/team" antes de merge [7] **[3/3]** |
| Dismiss stale approvals on new commits | ✅ | descarta aprobaciones obsoletas al cambiar el diff [7] **[3/3]** |
| Require conversation resolution | ✅ | exige resolver todos los comentarios antes del merge [7] **[3/3]** |
| Require status checks to pass | ✅ (lint, build, test, migraciones) | "ensure all required CI tests pass before changes" [7] **[3/3]** |
| Require linear history | ✅ en `main` | impide merge commits → fuerza squash/rebase [7][8] **[3/3]** |
| Require signed commits | opcional | solo commits firmados/verificados [7] **[3/3]** |
| Block force pushes | ✅ (viene por defecto) | habilitada por defecto [8] **[3/3]** |
| Restrict who can push | ✅ | solo usuarios/equipos/apps autorizados [8] **[3/3]** |
| **No permitir bypass (incluye admins)** | ✅ | ⚠️ **por defecto las reglas NO aplican a admins ni a quien tenga "bypass branch protections"; hay que habilitarlo explícitamente** [8] **[3/3]** |

> El punto del bypass es el más subestimado: si no lo activas, un admin puede saltarse todo
> sin querer. Verificado y unánime [8].

A nivel **organización**: 2FA obligatorio para todo el que tenga `write`; permisos a equipos,
no a personas (§6).

### Revisión de código (escalar sin cuello de botella)

- **Optimiza la velocidad del equipo, no la individual.** "If your whole team optimizes for
  individual speed, your codebase will suffer" — lo que importa es la velocidad del equipo
  completo [4] **[2/3]**. Las revisiones lentas frenan al equipo aunque no afecten al autor
  [4].
- **SLA de 24 h hábiles.** Google fija la expectativa de **dar feedback dentro de un día
  hábil** [4] **[3/3]**. No interrumpir un bloque de concentración para revisar — espera a un
  punto de corte natural [4] **[3/3]**.
- **Un revisor suele bastar.** En Google **la mayoría de las revisiones las hace exactamente
  un revisor** [5] **[3/3]**; pedir múltiples aprobaciones para todo es un obstáculo [1]
  **[3/3]**. Reserva las 2 aprobaciones para lo de alto riesgo (`main`/prod).
- **Code owners: cualquiera del equipo basta.** Cuando se requiere revisión de owners, alcanza
  con la aprobación de **uno** de los propietarios, no de todos [6] **[3/3]**. No se piden en
  PRs en **draft** [6] **[3/3]**.
- **Automatiza lo mecánico.** Lint/format en CI sacan estilo de la revisión humana. La
  revisión es además un **canal de transferencia de conocimiento**: los ingenieros tienden a
  responder cada revisión aunque no lean cada correo [5] **[2/3]**.

---

## 4. Propiedad por dominio: CODEOWNERS (P0)

Asigna **equipos responsables por área**; con "require review from Code Owners", cada PR exige
aprobación de quien sabe del dominio [6][7]. Mecánica oficial a conocer [6] **[3/3]**:

- GitHub busca `CODEOWNERS` en **`.github/`, raíz y `docs/`** — en ese orden; usa el primero.
- **Gana el último patrón que hace match** → ordena de lo general a lo específico.
- Si el owner es un **equipo**, debe ser **visible y con permiso `write`**, aunque sus miembros
  ya lo tengan individualmente.

Dominios reales del repo (→ [`.github/CODEOWNERS`](../../.github/CODEOWNERS)): ingesta/hub,
datos/dedup, FR, admin/moderación, mapa/UI, base de datos, CI/infra. Para áreas de alto riesgo
(`supabase/`, `.github/`) se suma `@maintainers` como co-owner.

> Validación a escala: el modelo de archivos `OWNERS` de Google **ha escalado dos décadas
> permitiendo que decenas de miles de ingenieros trabajen sobre la misma base de código** [5]
> **[2/3]**.

---

## 5. Migraciones de BD sin colisiones (P0 — dolor ya vivido aquí)

Este repo **ya** sufrió una colisión (`0014` doble → renumerado a `0015`). Con N colaboradores
en paralelo se vuelve crónico. Lo que dicen las fuentes de ingeniería:

**El problema es de grafo, no de lista.** Alembic modela las migraciones como un **DAG, no una
lista enlazada**; cuando hay ramas concurrentes aparecen **múltiples heads** y la tabla de
versión guarda varias filas a la vez [11] **[3/3]**. Es exactamente lo que pasó aquí.

**Recomendaciones priorizadas:**

1. **Nombrar por timestamp, no secuencial** (`YYYYMMDDHHMM_descripcion.sql`). Dos ramas casi
   nunca generan el mismo minuto → sin colisión de archivo. GitLab refuerza una regla de orden
   temporal: "a new migration's timestamp should never be before the previous required upgrade
   stop" [10] **[3/3]**. *(Verificado: el runner del repo extrae la versión con
   `grep '^[0-9]+'` y ordena lexicográficamente → un timestamp funciona y ordena tras `0020`.)*
2. **Resolver heads explícitamente.** Si dos ramas ramifican, Alembic ofrece un **merge** cuyo
   `down_revision` apunta a **ambos padres** [11] **[3/3]**, o `depends_on` para mantener los
   flujos independientes sin fusionarlos [11] **[3/3]**. La clave: resolución **explícita**,
   no un orden roto silencioso.
3. **Sin downtime, nunca.** GitLab: "migrations are not allowed to require GitLab installations
   to be taken offline **ever**" [10] **[3/3]**. Para cambios destructivos → patrón
   **expand → migrate → contract** (añadir lo nuevo; migrar el código; borrar lo viejo en una
   migración **posterior**).
4. **Migraciones acotadas en tiempo.** GitLab fija límites duros: **regulares ≤3 min**,
   **post-deploy ≤10 min** [10] **[3/3]**. Una migración larga en prod es un incidente.
5. **Reversibilidad y rollback.** Diseña la migración como reversible [10] **[2/3]**. Ojo con
   el motor: **MySQL no soporta transacciones en cambios de esquema** → si falla, hay que
   deshacer a mano [12] **[3/3]** (Postgres/Supabase sí las soporta — aprovéchalo envolviendo
   en transacción).
6. **CI que prueba el historial completo:** un job que levanta DB vacía y aplica **todas** las
   migraciones en orden detecta heads rotos antes del merge.

> **Caveats (refutados en la 1ª corrida, mantenidos como advertencia):** un *checklist* en la
> plantilla de PR **no obliga** a cumplir buenas prácticas (es recordatorio, no control); y
> Git **no** detecta de forma fiable cuando dos migraciones tocan el mismo objeto por archivos
> distintos. La defensa real es **automática** (CI), no manual.

➡️ Playbook operativo: [`gestion-de-migraciones.md`](./gestion-de-migraciones.md).

---

## 6. Gobernanza: roles, ingreso y decisiones (P1)

**Roles en tiers** (modelo mínimo viable):

| Rol | Puede | Cómo se obtiene |
|---|---|---|
| **Contributor** | Issues y PRs (fork o rama) | Cualquiera |
| **Triager** | Etiquetar, cerrar/mover issues — **sin** write a código | Se otorga liberalmente |
| **Code Owner** (por dominio) | Revisar/aprobar PRs de su área | Compromiso sostenido |
| **Maintainer** | Merge a `staging`/`main`, releases | Confianza demostrada |

Respaldo y matices:
- **Triage como puerta de entrada.** "If you don't have time to code, consider helping with
  triage" [14] **[3/3]** — descarga a los maintainers y engancha gente nueva.
- **Permisos acotados por rol.** En Kubernetes, el permiso de **asignar labels, cambiar
  milestones o cerrar issues ajenos** se concede solo a autor, asignados y **miembros de la
  organización** [13] **[3/3]**.
- **Foco contra scope creep.** "Having a clear, documented vision keeps you focused and helps
  you avoid scope creep from others' contributions" [16] **[2/3]**.
- **Decir que no, con criterios escritos.** Apoyar un rechazo en criterios del proyecto se
  percibe **menos personal** que en preferencia individual [16] **[2/3]**.
- **Anti-burnout.** Un maintainer experimentado sitúa el balance sano en **2–5 h/semana** para
  que no se sienta como trabajo [16] **[2/3]** → reparte carga, no la concentres.
- **Permisos a equipos, no a personas; 2FA; mínimo 2 owners** de la org (bus factor).

**Comunicación:** por defecto **pública y asíncrona**, con **dos excepciones que SIEMPRE deben
tener vía privada: seguridad y violaciones sensibles del código de conducta** [17] **[3/3]**
(de ahí el `SECURITY.md`).

**ADRs (Architecture Decision Records):** una decisión por archivo, en `docs/adr/`, enlazando
los superseded. (El repo hermano `venezuela-ayuda-hub-api` ya tiene este formato — reusarlo.)
Detalle de roles, ingreso y plantilla de ADR: [`gobernanza.md`](./gobernanza.md).

---

## 7. Onboarding, issues y retención (P1)

El embudo de contribuidores es frágil — y medible:

- **El 50 % contribuye una sola vez.** Un estudio sobre proyectos OSS top halló que **~50 % de
  los contribuidores hacen una única contribución**, sin compromiso a largo plazo [20]
  **[3/3]**. La primera experiencia decide.
- **La primera respuesta importa, y rápido.** Un estudio masivo (**2,76 M de primeras
  contribuciones**) plantea que **respuestas negativas iniciales** llevan a abandonar [19]
  **[3/3]**; las interacciones se correlacionan positivamente con volver a contribuir [19]. Y
  el de Mozilla: revisión **dentro de 48 h** → mucho mayor retorno [17] **[3/3]**.
- **Documentación = barrera #1.** La GitHub Open Source Survey 2017: **documentación
  incompleta/confusa es el mayor problema** para los usuarios de OSS [17] **[3/3]**.
- **Tests aceleran el merge** y dan confianza al contribuidor [16] **[3/3]**.
- **Plantillas filtran ruido.** Exigir completar una plantilla/checklist **reduce las
  contribuciones de baja calidad** [16] **[3/3]** (→ nuestros issue forms y PR template).

**Triage de issues a escala** (de Kubernetes y moby/moby — sistemas con miles de issues):
- **Ciclo con label de entrada:** `needs-triage` → al triar se quita y se pone `triage/accepted`
  [13] **[3/3]**.
- **Prioridades con semántica clara:** P0 = urgente (seguridad, bugs críticos, bloqueantes);
  P1 = imprescindible para el próximo release; P3 = best-effort [14] **[3/3]**. Los
  `critical-urgent` se trabajan "drop what you're doing" y antes del próximo release [13]
  **[3/3]**.
- **Higiene de la cola:** si un issue con label de área lleva **30 días sin movimiento**, se
  le recuerda gentilmente al equipo [13] **[3/3]**; los bots marcan **stale** tras inactividad
  (Kubernetes a 90 días [13]; `actions/stale` a 60 por defecto [15]) **[3/3]**.
- **Confirmar reproduciendo:** la label `status/confirmed` solo se pone si **se logró
  reproducir** el problema [14] **[3/3]**.

➡️ Proceso completo: [`gestion-de-issues.md`](./gestion-de-issues.md).

### Datos sensibles (transversal a todo)

Esta app maneja PII en una emergencia. De los marcos de datos responsables/humanitarios:
- **Backups probados, no solo hechos:** "regularly back up your files, **and test these
  procedures** on a regular basis" [22] **[3/3]**.
- **Conectividad frágil:** tras un desastre las redes de telecomunicación suelen caer, lo que
  condiciona el diseño y la dependencia de servicios [23] **[3/3]**.

---

## 8. Entregables

Implementan lo anterior; ya están en el repo:

| Archivo | Qué resuelve |
|---|---|
| [`CONTRIBUTING.md`](../../CONTRIBUTING.md) | Onboarding + flujo + reglas de oro de prod |
| [`SECURITY.md`](../../SECURITY.md) | Reporte privado (seguridad/PII) |
| [`.github/CODEOWNERS`](../../.github/CODEOWNERS) | Propiedad por dominio (§4) |
| [`.github/pull_request_template.md`](../../.github/pull_request_template.md) | PR pequeño + checklist de migraciones |
| [`.github/ISSUE_TEMPLATE/`](../../.github/ISSUE_TEMPLATE/) | Issue forms + config |
| [`.github/labels.yml`](../../.github/labels.yml) + [`workflows/labels.yml`](../../.github/workflows/labels.yml) | Taxonomía de labels + sync |
| [`estrategia-de-ramas-y-proteccion.md`](./estrategia-de-ramas-y-proteccion.md) | Modelo de ramas + reglas exactas (§2-3) |
| [`gestion-de-migraciones.md`](./gestion-de-migraciones.md) | Playbook anti-colisión (§5) |
| [`gestion-de-issues.md`](./gestion-de-issues.md) | Triage, labels, ciclo de vida, board (§7) |
| [`gobernanza.md`](./gobernanza.md) | Roles, ingreso, decisiones, ADRs (§6) |

---

## 9. Fuentes

Todas verificadas con extracción de afirmaciones + cita textual + verificación adversarial de
3 votos. Calidad: **primaria** = doc oficial / paper / fuente de origen; **secundaria** = guía
establecida.

**Flujo Git / revisión / protección**
1. DORA — *Trunk-based development* — dora.dev `[primaria]`
2. M. Fowler — *Patterns for Managing Source Code Branches* — martinfowler.com `[primaria]`
3. *Trunk Based Development — Short-lived feature branches* — trunkbaseddevelopment.com `[primaria]`
4. Google — *Engineering Practices: Speed of Code Reviews* — google.github.io/eng-practices `[primaria]`
5. Google — *Software Engineering at Google*, cap. 9 (Code Review) — abseil.io `[primaria]`
6. GitHub Docs — *About code owners* `[primaria]`
7. GitHub Docs — *Available rules for rulesets* `[primaria]`
8. GitHub Docs — *About protected branches* `[primaria]`
9. GitHub Docs — *Managing a merge queue* `[primaria]`

**Migraciones de BD**
10. GitLab — *Migration style guide* — docs.gitlab.com `[primaria]`
11. Alembic — *Working with Branches* — alembic.sqlalchemy.org `[primaria]`
12. Django — *Migrations* — docs.djangoproject.com `[primaria]`

**Issues / gobernanza / onboarding**
13. Kubernetes — *Issue Triage Guidelines* — kubernetes.dev `[primaria]`
14. moby/moby — *ISSUE-TRIAGE.md* — github.com `[primaria]`
15. *actions/stale* — github.com `[primaria]`
16. Open Source Guides — *Best Practices for Maintainers* — opensource.guide `[secundaria]`
17. Open Source Guides — *Building Welcoming Communities* — opensource.guide `[secundaria]`
18. Open Source Guides — *Leadership and Governance* — opensource.guide `[secundaria]`
19. Z. et al. — *First contributions study (2.76M PRs)* — arXiv:2104.02933 `[primaria]`
20. Pinto/Steinmacher/Gerosa — *Single-contribution study* — ime.usp.br `[primaria]`

**Respuesta a desastres / datos sensibles**
21. GFDRR — *Volunteer Technology Communities — Open Development* `[primaria]`
22. The Engine Room — *Responsible Data Handbook* `[primaria]`
23. ICRC — *Handbook on data protection in humanitarian action* `[primaria]`
24. Sahana Foundation — sahanafoundation.org `[primaria]`

_Investigación: 2 pasadas · 13 ángulos · 44 URLs leídas · 234 afirmaciones extraídas ·
115 verificadas (3 votos c/u) · 0 refutadas en la corrida final · 24 fuentes (23 primarias)._
