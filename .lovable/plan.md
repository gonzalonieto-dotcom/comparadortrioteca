

# Fix: Políticas RLS y Usuarios de Prueba

## Problema detectado

Las políticas de seguridad (RLS) de las 4 tablas están creadas como **RESTRICTIVE** en lugar de **PERMISSIVE**. En modo restrictivo, TODAS las políticas deben cumplirse a la vez. Esto significa que un usuario anónimo que accede via `/op/:token` falla porque la política de "gestores autenticados" también se evalúa y bloquea el acceso. De ahí el error de "token de validación".

## Plan de corrección

### 1. Migración SQL: Corregir las políticas RLS

Eliminar las 8 políticas actuales (2 por tabla) y recrearlas como **PERMISSIVE** (el comportamiento por defecto de Postgres, donde basta con que UNA política permita el acceso).

Además, la política de lectura pública en `operations` debe filtrarse por `share_token IS NOT NULL` para que solo se lean operaciones compartidas.

Tablas afectadas:
- `operations`: SELECT público (con filtro share_token), ALL para el gestor dueño
- `offers`: SELECT público (si la operación tiene share_token), ALL para el gestor dueño
- `offer_linkages`: SELECT público, ALL para el gestor dueño
- `offer_mixed_periods`: SELECT público, ALL para el gestor dueño

### 2. Crear usuarios de prueba

Ya que la autenticación requiere verificación de email, vamos a **habilitar auto-confirm temporalmente** para poder crear los usuarios de prueba, y luego los crearemos desde el código:

- **Gestor**: `gestor@trioteca.test` / password: `gestor123`
- **Cliente**: El cliente NO necesita cuenta -- accede via link `/op/:token` sin autenticación

Nota: El "cliente" no necesita usuario porque accede via token público. El comparador en `/` usa datos demo y en `/op/:token` carga datos de la BD sin login.

### 3. Crear una seed de datos de prueba

Añadir un botón o script para que el gestor pueda crear una operación de ejemplo con ofertas precargadas, facilitando las pruebas.

## Detalle técnico

### Migración SQL

```sql
-- Drop all RESTRICTIVE policies and recreate as PERMISSIVE

-- operations
DROP POLICY IF EXISTS "Public read via share_token" ON public.operations;
DROP POLICY IF EXISTS "Users can manage own operations" ON public.operations;

CREATE POLICY "Public read via share_token" ON public.operations
  FOR SELECT USING (share_token IS NOT NULL);

CREATE POLICY "Users can manage own operations" ON public.operations
  FOR ALL TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- offers
DROP POLICY IF EXISTS "Public read offers via operation" ON public.offers;
DROP POLICY IF EXISTS "Users can manage offers of own operations" ON public.offers;

CREATE POLICY "Public read offers via operation" ON public.offers
  FOR SELECT USING (true);

CREATE POLICY "Users can manage offers of own operations" ON public.offers
  FOR ALL TO authenticated
  USING (operation_id IN (SELECT id FROM operations WHERE created_by = auth.uid()))
  WITH CHECK (operation_id IN (SELECT id FROM operations WHERE created_by = auth.uid()));

-- offer_linkages (same pattern)
-- offer_mixed_periods (same pattern)
```

### Ficheros modificados

- **Sin cambios de código** -- solo migración SQL para arreglar las políticas RLS
- Opcional: pequeño ajuste en `Login.tsx` para mostrar credenciales de prueba en desarrollo
