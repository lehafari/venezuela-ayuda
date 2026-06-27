# Gobernanza del proyecto

Quién hace qué, cómo se entra y cómo se decide. Mantener este documento **fiel a cómo opera
el proyecto de verdad** — exagerar la madurez genera fricción. Fundamento y fuentes:
[`00-mejores-practicas-colaboracion.md`](./00-mejores-practicas-colaboracion.md) §6.

## Roles

| Rol | Puede | Cómo se obtiene |
|---|---|---|
| **Contributor** | Abrir issues y PRs (fork o rama) | Cualquiera |
| **Triager** | Etiquetar, mover/cerrar issues, pedir cambios — **sin** write a código | Se otorga liberalmente; descarga a los maintainers |
| **Code Owner** (por dominio) | Revisar y aprobar PRs de su área | Compromiso sostenido en ese dominio |
| **QA / Testing** | Validar cambios en **staging**; su visto bueno es requisito para promover a `main` | Equipo dedicado (`@mawmawmaw/equipo-qa`) |
| **Maintainer** | Merge a `staging`/`main`, **promoción `staging → main`** (tras QA), releases, gestión del repo | Confianza y alineación con la dirección del proyecto (más que skill puro) |

Áreas/dominios y sus owners están en [`.github/CODEOWNERS`](../../.github/CODEOWNERS):
ingesta, datos/dedup, fr, admin, mapa/ui, db, ci.

### Principios de permisos

- **Permisos a equipos, no a personas.** Más fácil de auditar y de rotar.
- **Mínimo 2 personas con rol owner** de la organización (bus factor).
- **2FA obligatorio** para todo el que tenga acceso de escritura.
- **Acceso a `write` se gana**, no se regala: para un sistema en prod, se otorga a quien
  demostró compromiso (varias contribuciones de calidad), no a la primera contribución.
- **Voluntarios y pagados se juzgan igual:** por mérito técnico, sin trato especial.

## Cómo se entra (camino del contribuidor)

1. **Contribuidor nuevo:** lee `CONTRIBUTING.md`, toma un `good first issue`, abre un PR
   (fork si es externo).
2. **Tras varias contribuciones de calidad** en un área → propuesta para **Code Owner** de
   ese dominio.
3. **Triager:** se ofrece a cualquiera que ayude con la gestión de issues (bajo riesgo).
4. **Maintainer:** lo proponen los maintainers actuales por confianza demostrada.

El onboarding es infraestructura: `README`, `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md` al
día + issues `good first issue` + esta doc.

## Cómo se decide

**Modelo:** núcleo de maintainers con decisión por **consenso**; si no hay consenso, decide
el/los maintainer(s) líder(es) (BDFL/meritocracia híbrido). Lo importante:
- Documentar el **razonamiento** de las decisiones relevantes (ver ADRs).
- La mayoría de las disputas son sobre **procesos**, no sobre lo técnico → cuando se repita un
  conflicto, se ajusta el proceso (este documento), no se discute caso por caso.

## ADRs (Architecture Decision Records)

Las decisiones estructurales se registran como ADR, **una por archivo**, en
`docs/adr/NNNN-titulo.md`. Reglas:

- **Una decisión por ADR**; conciso. Decisiones grandes → varios ADRs.
- Ubicación central y accesible a todo el equipo.
- Cuando un ADR **reemplaza** a otro, márcalo como *superseded* y enlaza al nuevo (trazabilidad).
- Aprobar un ADR es esfuerzo de equipo: el autor resuelve todos los comentarios hasta consenso.

Plantilla mínima:

```markdown
# NNNN — Título de la decisión

- Estado: propuesto | aceptado | reemplazado por [NNNN]
- Fecha: YYYY-MM-DD

## Contexto
Qué problema/restricción motiva la decisión.

## Decisión
Qué decidimos hacer.

## Consecuencias
Qué gana y qué cuesta. Riesgos. Qué queda fuera.
```

> El repo hermano `venezuela-ayuda-hub-api` ya tiene ADRs en `docs/adr/` — reusar ese formato.

## Escalar sin cuello de botella

- **Delegar en equipos pequeños por dominio** en vez de concentrar todo en una persona.
- **Automatizar lo mecánico** (lint/format/tests en CI) para que la revisión humana se enfoque
  en lógica y seguridad.
- Considerar un **community manager** (aunque sea voluntario) que dé la bienvenida, modere
  discusiones y haga triage — escala la gobernanza sin recargar a los maintainers técnicos.
- Repartir la revisión vía **CODEOWNERS** con varios miembros por equipo (evita que un solo
  owner sea el embudo).
