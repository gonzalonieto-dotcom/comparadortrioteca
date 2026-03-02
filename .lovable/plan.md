

# Fix: Habilitar extension pgcrypto

## Problema
La funcion `generate_share_token()` usa `gen_random_bytes(12)` que requiere la extension `pgcrypto`. Esta extension no esta habilitada, por lo que al crear una operacion nueva falla con el error `gen_random_bytes(integer) does not exist`.

## Solucion

Una sola migracion SQL:

```sql
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
```

Esto habilita `pgcrypto` y la funcion `gen_random_bytes` queda disponible. No se necesitan cambios en codigo, solo esta migracion.

## Alternativa considerada
Podriamos cambiar la funcion para usar `gen_random_uuid()::text` en lugar de `gen_random_bytes`, pero `pgcrypto` es una extension estandar de Supabase y es mejor habilitarla ya que genera tokens mas seguros.
