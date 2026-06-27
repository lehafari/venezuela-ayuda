# AGENTS.md — instrucciones para agentes de IA

> **Fuente única de verdad para TODOS los agentes de IA** (Claude Code, Cursor, GitHub
> Copilot, OpenAI Codex). `AGENTS.md` es el estándar abierto que estas herramientas leen;
> los demás archivos (`CLAUDE.md`, `.cursor/rules/`, `.github/copilot-instructions.md`)
> **apuntan aquí** para no duplicar ni divergir.
>
> Si editas las reglas de la IA, **edita este archivo**. El agente lee el `AGENTS.md` más
> cercano al archivo que toca; este (raíz) aplica a todo el repo.
>
> ⚠️ Esto es **contexto en lenguaje natural, no un control que se hace cumplir solo**. Las
> barreras duras (bloquear acciones, gates de CI) viven en hooks/permits/CI — ver
> [`docs/colaboracion/harness-ia.md`](docs/colaboracion/harness-ia.md).

## Qué es este proyecto

`venezuela-ayuda` — app **Next.js en PRODUCCIÓN** para respuesta a una emergencia en
Venezuela. Coordina personas, solicitudes/ofertas de ayuda, edificios dañados y centros de
acopio. Maneja **datos personales reales (PII)**. Un error en producción afecta a personas
en una emergencia.

- Stack: Next.js (App Router) + TypeScript + Supabase (Postgres). Lógica pura de ingesta/dedup
  en `.mjs` testeable con `node --test`.
- Ramas: `feat/* → staging → main`. **`main` = producción.**

## Reglas de oro (NUNCA las rompas)

1. **Cautela en producción.** Ante cualquier acción que afecte datos reales o `main`,
   **detente y pregunta**. "Compila" no es "funciona".
2. **PII nunca se filtra.** No imprimas teléfonos/contactos/`manage_token` en logs ni los
   expongas por endpoints o vistas públicas. No los pegues en commits, issues o PRs.
3. **Secretos jamás al repo.** Nunca commitees `.env*`, API keys o tokens. Si encuentras uno
   filtrado, avísalo — no lo ignores.
4. **No te saltes las barreras.** Nunca uses `--no-verify`, no deshabilites checks de CI, no
   hagas push directo a `main`/`staging`, no fuerces push (`--force`) a ramas compartidas.
5. **Un humano es responsable.** Tu salida es una **propuesta**: va por PR y la revisa una
   persona. No mergeas tú.

## Comandos (úsalos para verificar tu trabajo)

```bash
npm install          # dependencias
npm run dev          # servidor local
npm run lint         # ESLint  ← debe pasar
npm run build        # next build  ← debe pasar
npm test             # node --test scripts/*.test.mjs  ← debe pasar
```

**Antes de proponer cambios, corre `lint`, `build` y `test` y deja que pasen.** Si listas o
sigues estos comandos, ejecútalos y **corrige los fallos antes de terminar la tarea**, no
después.

## Cómo trabajar aquí

1. **Cambios pequeños y enfocados.** Un PR = un cambio lógico. Ramas `feat/<área>/<desc>`
   desde `staging` (áreas: `ingesta`, `datos`, `fr`, `admin`, `mapa`, `db`, `ci`, `ui`).
2. **Imita el código existente.** Convenciones, naming, densidad de comentarios del entorno.
   No introduzcas dependencias ni patrones nuevos sin justificarlo.
3. **Verifica contra lo real.** La lógica de ingesta/dedup tiene tests (`scripts/*.test.mjs`);
   amplíalos cuando cambies comportamiento.
4. **Commits** en conventional commits (`feat(ingesta): …`). Si un humano y la IA co-escriben,
   se puede atribuir con `Co-authored-by:` (usa el email de la cuenta de GitHub para que cuente).
5. **PRs** contra `staging`. Llena la plantilla; marca el checklist de migraciones si aplica.

## Permisos: Always / Ask first / Never

**✅ Always (puedes hacerlo sin preguntar):**
- Leer el código, correr `lint`/`build`/`test`, formatear.
- Escribir y **añadir** tests (nunca borrarlos, ver abajo).
- Crear ramas `feat/*`, abrir PRs en borrador.

**⚠️ Ask first (propón y espera aprobación humana):**
- Cambios en `supabase/migrations/` (ver [migraciones](docs/colaboracion/gestion-de-migraciones.md)).
- Tocar `src/lib/fr.ts` (reconocimiento facial), `src/app/admin/` o cualquier flujo con PII.
- Instalar/actualizar dependencias; cambiar config de build, CI o `next.config`.
- Cualquier cosa que escriba en producción o llame a servicios externos con datos reales.

**⛔ Never (no lo hagas nunca):**
- Commitear secretos o `.env*`; editar `node_modules/` o cualquier `vendor/`.
- Exponer PII en logs, endpoints públicos, commits, issues o PRs.
- **Borrar o deshabilitar un test porque está fallando** — arregla la causa o repórtalo.
- Push directo a `main`/`staging`, `--force` a ramas compartidas, `--no-verify`, saltarte CI.
- Migraciones destructivas en la misma migración que añade (usa expand → migrate → contract).
- Ejecutar comandos destructivos (`rm -rf`, `DROP`, `TRUNCATE`, resets de DB) sin aprobación.

## Flujo de trabajo: planear → ejecutar → verificar

Para cualquier cambio **no trivial**, sigue este ciclo (en vez de codear directo):

1. **Planear** — diseña un plan concreto antes de tocar código (archivos, pasos, riesgos,
   cómo verificar). En Claude Code: subagente **`planner`**.
2. **Ejecutar** — implementa siguiendo el plan, imitando el código existente; escribe los
   tests en la misma iteración.
3. **Verificar** — corre `lint`/`build`/`test` y revisa el diff contra las reglas de oro
   (PII, secretos, tests, migraciones). En Claude Code: subagente **`verifier`**. Si falla,
   vuelve a ejecutar con el error exacto. **No cierres con el gate en rojo.**

En **Claude Code** el ciclo está automatizado con el comando **`/feature <descripción>`**
(orquesta `planner → executor → verifier`); los subagentes viven en `.claude/agents/`.
Otros agentes (Cursor/Copilot/Codex): aplica el mismo ciclo manualmente — planifica primero,
implementa, y **verifica con los comandos de arriba antes de terminar**.

Escala el flujo a la tarea: cambios triviales pueden ser una sola pasada; reserva el ciclo
completo para lo no trivial o lo que toca datos reales.

## Migraciones de base de datos ⚠️

Alto riesgo con muchos colaboradores. Antes de tocar `supabase/migrations/`, lee
[`docs/colaboracion/gestion-de-migraciones.md`](docs/colaboracion/gestion-de-migraciones.md).
Resumen: **nombre por timestamp** (`YYYYMMDDHHMM_desc.sql`, no secuencial), **idempotente**
(`if not exists`), **reversible**, y cambios destructivos en una migración **posterior**.

## Más contexto

- Cómo colaborar (ramas, revisión, gobernanza): [`docs/colaboracion/`](docs/colaboracion/)
- Cómo contribuir: [`CONTRIBUTING.md`](CONTRIBUTING.md) · Seguridad/PII: [`SECURITY.md`](SECURITY.md)
- Por qué de este harness (con fuentes): [`docs/colaboracion/harness-ia.md`](docs/colaboracion/harness-ia.md)
- Flujo planear→ejecutar→verificar y los subagentes: [`docs/colaboracion/flujo-agentes-ia.md`](docs/colaboracion/flujo-agentes-ia.md)

_Mantén este archivo conciso (apunta a <~300 líneas). Las herramientas tienen límites de
carga (p. ej. Codex corta el conjunto de AGENTS.md a 32 KiB; Cursor recomienda reglas
<500 líneas). Detalle largo → enlázalo, no lo pegues._
