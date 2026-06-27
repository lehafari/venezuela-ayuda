# Gestión de migraciones de base de datos

> El mayor riesgo de coordinación con muchos colaboradores. Este repo **ya** vivió una
> colisión (`0014` para `collection_centers` y para `api_partners` a la vez → renumerado a
> `0015`). Esta guía la mata de raíz. Fundamento y fuentes:
> [`00-mejores-practicas-colaboracion.md`](./00-mejores-practicas-colaboracion.md) §5.

## El problema

Dos ramas concurrentes crean cada una una migración y ambas toman "el siguiente número"
(`0021_…`). Al mergear las dos: números duplicados, múltiples *heads*, y el despliegue
falla o aplica en un orden incorrecto. Con N colaboradores en paralelo, esto pasa seguido.

## La solución (orden de adopción)

### 1. Nombrar por timestamp, no por número secuencial ✅ (cambio principal)

```
ANTES:  supabase/migrations/0021_mi_cambio.sql        ← colisiona
AHORA:  supabase/migrations/202606271045_mi_cambio.sql ← prácticamente único
```

Formato: **`YYYYMMDDHHMM_descripcion.sql`** (año-mes-día-hora-min). Dos ramas distintas casi
nunca generan el mismo minuto → no hay colisión de nombre de archivo. Los nombres descriptivos
(no ceros a la izquierda) son justo lo que recomiendan los frameworks para evitar este dolor.

> **Transición:** las migraciones existentes (`0001`…`0020`) se quedan como están. La regla
> de timestamp aplica **de aquí en adelante**. El runner las sigue ordenando lexicográficamente,
> y `0020 < 202606…`, así que el orden se mantiene.

### 2. El orden solo importa por objeto

Dos migraciones que tocan **tablas distintas** pueden aplicarse en cualquier orden. Solo las que
tocan la **misma** tabla deben ordenarse entre sí. Esto reduce los "conflictos" falsos: no te
preocupes por el orden global, preocúpate por el orden **dentro de cada tabla**.

### 3. Aplicación tolerante al orden (out-of-order)

El runner (`apply-migrations.sh`) ya gatea por la tabla `applied_migrations` (cada migración
corre **una sola vez**). Asegúrate de que aplique **cualquier** migración pendiente aunque su
timestamp sea anterior a otras ya aplicadas (los contribuidores terminan en orden impredecible).

### 4. Cada migración: idempotente e independiente

```sql
-- ✅ idempotente: se puede re-aplicar sin romper
create table if not exists ...;
alter table x add column if not exists ...;
insert into ... on conflict do nothing;
create unique index if not exists ...;
```

- No debe dejar el esquema roto si se libera **sola** (sin las que vienen después).
- Una migración = un cambio cohesivo.

### 5. Cambios destructivos: expand → migrate → contract

Nunca borres/renombres en la misma migración que añades. Para cero downtime en prod:

1. **Expand:** añade lo nuevo (columna/tabla nueva, nullable).
2. **Migrate:** despliega el código que escribe en lo nuevo; backfill de datos.
3. **Contract:** en una migración **posterior** (otro PR, cuando ya nada usa lo viejo),
   elimina lo antiguo.

### 6. Seguridad en prod

- Fija `lock_timeout` dentro de la migración: ante bloqueo prolongado, **falla la migración**
  en vez de tumbar la base.
- Cuidado con operaciones que bloquean la tabla (p. ej. `ADD COLUMN ... DEFAULT` en versiones
  viejas de Postgres, crear índice sin `CONCURRENTLY`). El lint de migraciones (abajo) las marca.

## CI: que el robot atrape los problemas, no el checklist

> ⚠️ Un checklist en la plantilla de PR **no garantiza** nada por sí solo (lo verificamos: es
> recordatorio, no control). Y Git **no** detecta de forma fiable cuando dos migraciones tocan
> el mismo objeto por archivos distintos. Por eso la defensa real es **automática**:

1. **Test de historial completo** (recomendado añadir): un job que levanta una **DB vacía** y
   aplica **todas** las migraciones en orden. Si hay un *head* roto o un orden inválido, falla
   el PR antes del merge.
2. **Lint de migraciones** (opcional, alto valor): herramienta tipo *Squawk* que marca
   operaciones riesgosas (locks, defaults peligrosos).
3. **`check-migrations.yml`** (ya existe): avisa en el PR si la migración no está aplicada en la
   DB de la rama destino.

## Checklist al crear una migración

- [ ] Nombre `YYYYMMDDHHMM_descripcion.sql`.
- [ ] Idempotente (`if not exists` / `on conflict do nothing`).
- [ ] No deja el esquema roto si corre sola.
- [ ] Si es destructiva → patrón expand/migrate/contract (el borrado va en otro PR posterior).
- [ ] Insert en `applied_migrations` al final (según convención del repo).
- [ ] Probada contra la **DB de staging** (PR a `staging`) antes de promover a `main`.

## Si igual ocurre una colisión

1. La segunda persona **renombra** su archivo a un timestamp nuevo y mayor.
2. Verifica las **dependencias por objeto**: si ambas tocaban la misma tabla, confirma que el
   orden resultante es correcto.
3. Corre el test de historial completo en local (DB vacía + aplicar todo) antes de re-pushear.
