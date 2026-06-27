# CLAUDE.md

Las instrucciones del proyecto para agentes de IA viven en **`AGENTS.md`** (fuente única de
verdad, compartida con Cursor, Copilot y Codex). Claude Code las importa aquí:

@AGENTS.md

> No dupliques reglas en este archivo: edita `AGENTS.md`. Si necesitas notas exclusivas de
> Claude Code (hooks, permisos, subagentes, skills), agrégalas debajo de esta línea o en
> `.claude/settings.json`. Recuerda: `CLAUDE.md` es **consultivo** (se entrega como mensaje
> de usuario, sin cumplimiento estricto); para barreras duras usa hooks `PreToolUse`/`Stop`
> o `permissions` en `.claude/settings.json` — ver `docs/colaboracion/harness-ia.md`.
