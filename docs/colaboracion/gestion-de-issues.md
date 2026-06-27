# Gestión de issues (triage, labels y board)

Cómo entran, se clasifican y se trabajan los issues con muchos colaboradores. Fundamento:
[`00-mejores-practicas-colaboracion.md`](./00-mejores-practicas-colaboracion.md) §6.

## Plantillas

Al abrir un issue se elige una plantilla (issues en blanco están deshabilitados):
- **🐞 Reporte de bug** (`.github/ISSUE_TEMPLATE/bug_report.yml`) — captura entorno, área y severidad.
- **✨ Propuesta de mejora** (`feature_request.yml`) — captura área e impacto.
- **🔐 Seguridad / PII** y **💬 Dudas** → enlaces (no abren issue público), ver `config.yml`.

Las plantillas aplican automáticamente `status:needs-triage` + el tipo (`bug`/`enhancement`).

## Taxonomía de labels

Fuente de verdad: [`.github/labels.yml`](../../.github/labels.yml). Cuatro ejes ortogonales —
un issue bien clasificado tiene **uno de cada**:

| Eje | Labels | Quién la pone |
|---|---|---|
| **Tipo** | `bug` · `enhancement` · `documentation` · `question` | La plantilla / quien abre |
| **Área** | `area:{ingesta,datos,fr,admin,ui,db,ci}` | Triager (según el desplegable de la plantilla) |
| **Prioridad** | `priority:{p0,p1,p2,p3}` | Triager |
| **Estado** | `status:{needs-triage,triaged,in-progress,blocked}` | Flujo de trabajo |
| Especiales | `good first issue` · `help wanted` · `security` | Triager |

> Los desplegables de área/severidad de las plantillas **no aplican la label solos** (su
> valor va al cuerpo del issue); el triager la traduce a `area:*`/`priority:*`. Es un paso de
> 5 segundos y mantiene el control humano.

### Crear las labels en el repo

Un maintainer con permiso `write` las crea de una de dos formas:

**A) Workflow de sync (recomendado).** Ya incluido en
[`.github/workflows/labels.yml`](../../.github/workflows/labels.yml): corre **Actions → Sync
labels → Run workflow**, o automáticamente al cambiar `labels.yml` en `main`. Usa
`skip-delete: true` → nunca borra labels existentes.

**B) Manual con `gh` (sin CI).** Pegar en una terminal autenticada con `write`:

```bash
REPO=mawmawmaw/venezuela-ayuda
# Áreas
for a in ingesta datos fr admin ui db ci; do
  gh label create "area:$a" --repo $REPO --color 1d76db --description "Área: $a" --force
done
# Prioridad
gh label create "priority:p0" --repo $REPO --color b60205 --description "Crítico — prod ahora" --force
gh label create "priority:p1" --repo $REPO --color d93f0b --description "Alto" --force
gh label create "priority:p2" --repo $REPO --color fbca04 --description "Medio" --force
gh label create "priority:p3" --repo $REPO --color c2e0c6 --description "Bajo" --force
# Estado
gh label create "status:needs-triage" --repo $REPO --color ededed --description "Espera triage" --force
gh label create "status:triaged"      --repo $REPO --color 0e8a16 --description "Listo para tomar" --force
gh label create "status:in-progress"  --repo $REPO --color fbca04 --description "En curso" --force
gh label create "status:blocked"      --repo $REPO --color b60205 --description "Bloqueado" --force
# Especiales
gh label create "security" --repo $REPO --color b60205 --description "Seguridad / privacidad" --force
```

## Ciclo de vida de un issue

```
abierto (status:needs-triage)
   │  ── triage: tipo + area:* + priority:* ──▶  status:triaged
   │                                                │
   │                          alguien lo toma ──▶  status:in-progress  ── PR ──▶  cerrado
   │                                                │
   │                          falta dependencia ──▶ status:blocked
   └─ inválido/duplicado ──▶ cerrado (invalid/duplicate)
```

- **PRs cierran issues** con `Closes #N` en la descripción.
- Comenta en el issue **antes** de empezar a trabajarlo (evita trabajo duplicado) y pásalo a
  `status:in-progress` (o autoasígnate).

## Triage

- **Quién:** los **triagers** (rol de bajo riesgo, sin `write` a código — se otorga
  liberalmente) y los code owners del área. Ver [`gobernanza.md`](./gobernanza.md).
- **Qué hace el triage** a un `status:needs-triage`:
  1. ¿Es válido y no duplicado? Si no → cerrar con `invalid`/`duplicate`.
  2. Poner **`area:*`** (según el desplegable) y **`priority:*`**.
  3. ¿Buen punto de entrada? → `good first issue`. ¿Hace falta ayuda? → `help wanted`.
  4. Pasar a **`status:triaged`** y, si aplica, mandarlo al project board.
- **Cadencia:** revisar la cola `status:needs-triage` con regularidad (p. ej. a diario en
  emergencia activa). Un issue no debería quedar sin triage más de ~24-48 h.
- **p0 (crítico en prod):** notificar de inmediato al área y a un maintainer; no espera cola.

## Project board (Projects v2)

Un board compartido para coordinar entre áreas (lo crea un maintainer en la pestaña
**Projects** del repo/org):

- **Columnas por estado:** `Needs triage` → `Triaged` → `In progress` → `In review` → `Done`.
- **Vistas guardadas:** una por `area:*` (cada equipo ve lo suyo) y una de **prioridad** para
  los p0/p1.
- **Automatización:** auto-añadir issues nuevos a `Needs triage`; mover a `In review` cuando
  hay PR enlazado; a `Done` al cerrar.

## Onboarding vía issues

Mantener una cola sana de **`good first issue`** (pequeños, bien descritos, con pistas de
dónde tocar) es la mejor puerta de entrada para voluntarios nuevos — y baja la carga de los
maintainers.
