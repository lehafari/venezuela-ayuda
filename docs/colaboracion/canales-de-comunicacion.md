# Canales de comunicación

Dónde escribir según lo que necesites. La comunicación por defecto es **pública y asíncrona**;
el trabajo y las decisiones se rastrean en **issues y PRs** (los canales coordinan, no
reemplazan al issue tracker).

> ⚠️ Las **vulnerabilidades de seguridad y fugas de PII NO se reportan en un canal público** —
> van por la vía privada de [`SECURITY.md`](../../SECURITY.md). El canal `security-hub` es para
> coordinación general de seguridad, no para divulgar un fallo.

## Mapa de canales

| Canal | Para qué / cuándo ir | Área relacionada |
|---|---|---|
| `uix-chat` | UI/UX, frontend, mapa, vistas públicas | `mapa` · `ui` |
| `backend-api-chat` | Backend, API de ingesta, hub | `ingesta` |
| `apificacion-texto` | Procesamiento/clasificación de texto, APIs de texto | `datos` |
| `deploy` | Despliegues y promociones a producción (voz) | `ci` |
| `architecture-hub` | Decisiones de arquitectura y diseño (antes de un ADR) | transversal |
| `documentacion-📄` | Documentación: dudas, mejoras, organización de `docs/` | docs |
| `qa-hub` | QA y testing en **staging** antes de promover a `main` | QA |
| `observability-hub` | Logs, métricas, monitoreo, incidentes | `ci` · ops |
| `data-hub` | Datos, deduplicación, esquema, calidad de datos | `datos` · `db` |
| `security-hub` | Coordinación de seguridad/PII (no divulgación de fallos) | security |

> Las descripciones son una guía; ajústalas si un canal cambia de propósito.

## Cómo usarlos bien

- **Pregunta en el canal del área** que toca tu duda (ver la tabla). Si no sabes cuál, empieza
  por el más cercano y te redirigen.
- **Las decisiones y el trabajo viven en issues/PRs**, no en el chat: si algo se decide en un
  canal, déjalo registrado en el issue/PR o en un ADR (`architecture-hub` → ADR).
- **Coordina el QA en `qa-hub`** cuando tu cambio esté en staging (ver
  [`estrategia-de-ramas-y-proteccion.md`](./estrategia-de-ramas-y-proteccion.md) → QA en staging).
- **Async-first:** no asumas respuesta inmediata; deja contexto suficiente en el mensaje.
- **Seguridad/PII:** coordinación en `security-hub`, pero un fallo concreto → [`SECURITY.md`](../../SECURITY.md) (privado).
