# Cómo contribuir a venezuela-ayuda

Gracias por sumarte. Esto es una app **en producción** para respuesta a una emergencia:
lo que mergeamos afecta a personas reales. Por eso priorizamos **velocidad con frenos** —
moverse rápido, pero con barreras que impidan romper prod.

Lee esto una vez antes de tu primer PR. Toma 5 minutos y te ahorra rebotes.

> Documentación ampliada en [`docs/colaboracion/`](docs/colaboracion/): mejores prácticas
> (con fuentes), estrategia de ramas, gestión de migraciones y gobernanza.

## Reglas de oro (no negociables)

1. **Nunca pushees directo a `main` ni a `staging`.** Todo entra por Pull Request.
2. **`main` = PRODUCCIÓN.** Solo recibe merges desde `staging`.
3. **El CI manda.** Si lint/build/tests/migraciones fallan, no se mergea. No se saltan checks.
4. **PRs pequeños.** Un PR = un cambio lógico. Si no se revisa en 10 min, es muy grande.
5. **Cuidado con prod y con datos personales.** Nada de PII en logs ni en endpoints públicos.
   Ante la duda con datos reales, pregunta antes de actuar.

## Setup rápido

```bash
git clone <repo> && cd venezuela-ayuda
npm install
cp .env.example .env.local   # pide los valores al equipo (nunca subas .env*)
npm run dev
```

Antes de abrir un PR, en local debe pasar:

```bash
npm run lint
npm run build
node --test            # tests de lógica pura (.mjs)
```

## Flujo de trabajo (feat → staging → main)

```
feat/<área>/<descripción>  ──PR──▶  staging  ──PR──▶  main (PROD)
```

1. **Crea una rama** desde `staging`:
   `git checkout staging && git pull && git checkout -b feat/ingesta/validar-coords`
   - Convención de nombre: `feat|fix|docs|chore/<área>/<descripción-corta>`.
   - Áreas: `ingesta`, `dedup`, `fr`, `admin`, `mapa`, `db`, `ci`, `ui`.
2. **Haz commits pequeños** en conventional commits: `feat(ingesta): rechazar request sin coords`.
3. **Abre el PR contra `staging`** (no contra `main`). Llena la plantilla.
4. **El CODEOWNERS del área** revisa. Resuelve los comentarios; no se mergea con hilos abiertos.
5. **Mergea a `staging`** cuando esté aprobado y el CI verde. Pruébalo contra la DB de staging.
6. **Promoción a prod:** un maintainer abre PR `staging → main`. Doble aprobación.

### ¿Rama o fork?

- **Si tienes acceso de escritura** (equipos/colaboradores de confianza): trabaja en ramas
  dentro del repo.
- **Si eres colaborador externo nuevo**: haz **fork + PR**. Tras varias contribuciones de
  calidad se evalúa darte acceso (ver [gobernanza](docs/colaboracion/gobernanza.md)).

## Revisión de código

- Cada PR necesita aprobación del **Code Owner** del área que toca (ver
  [`.github/CODEOWNERS`](.github/CODEOWNERS)).
- `staging`: 1 aprobación. `main`: 2 aprobaciones.
- El revisor mira **lógica y seguridad**, no estilo (de eso se encarga el linter).
- Sé amable y concreto. Asume buena fe — mucha gente aquí es voluntaria.

## Migraciones de base de datos ⚠️

El mayor riesgo con muchos colaboradores. **Lee
[`gestion-de-migraciones.md`](docs/colaboracion/gestion-de-migraciones.md) antes de tocar
`supabase/migrations/`.** En resumen:

- Una migración nueva va en `supabase/migrations/` con **nombre por timestamp**
  (`YYYYMMDDHHMM_descripcion.sql`), no con número secuencial, para evitar colisiones.
- Cada migración debe ser **idempotente** (`if not exists`, `on conflict do nothing`) y no
  dejar el esquema roto si corre sola.
- Cambios destructivos en prod: patrón **expand → migrate → contract** (nunca borres en la
  misma migración que añades).
- El CI valida que todas las migraciones apliquen sobre una DB limpia.

## Issues

- ¿Empezando? Busca la etiqueta **`good first issue`**.
- Reporta bugs y propone features con las [plantillas](.github/ISSUE_TEMPLATE/).
- Para coordinar, comenta en el issue antes de empezar a trabajarlo (evita trabajo duplicado).

## Decisiones de arquitectura

Cambios estructurales se documentan como **ADR** (un archivo por decisión). Mira el formato
en [`docs/colaboracion/gobernanza.md`](docs/colaboracion/gobernanza.md#adrs).

## Seguridad

¿Encontraste una vulnerabilidad o una fuga de PII? **No abras un issue público.** Sigue
[`SECURITY.md`](SECURITY.md) (o escribe en privado al equipo de mantenimiento).
