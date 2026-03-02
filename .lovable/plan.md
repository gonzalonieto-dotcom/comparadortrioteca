
# Fix: Crear usuario de prueba y corregir acceso

## Problema

1. **El usuario `gestor@trioteca.test` no existe** -- se mostraron credenciales de prueba pero nunca se creó la cuenta. El login falla con "Invalid login credentials".
2. **Las políticas RLS siguen siendo RESTRICTIVE** -- la migración anterior creó políticas nuevas pero con nombres que coincidían parcialmente, y el resultado es que siguen bloqueando el acceso.

## Solución

### 1. Migración SQL: Recrear todas las políticas como PERMISSIVE

Eliminar TODAS las políticas existentes (tanto las originales como las nuevas) y recrearlas explícitamente como PERMISSIVE. En PostgreSQL, `CREATE POLICY` es PERMISSIVE por defecto, pero vamos a ser explícitos para evitar ambiguedad.

Las políticas a crear:
- `operations`: SELECT publico (con share_token IS NOT NULL), ALL para el gestor autenticado dueño
- `offers`: SELECT publico, ALL para el gestor dueño
- `offer_linkages`: SELECT publico, ALL para el gestor dueño  
- `offer_mixed_periods`: SELECT publico, ALL para el gestor dueño

### 2. Mejorar la página de Login

Modificar `src/pages/Login.tsx` para que el botón "Rellenar credenciales" primero intente registrar al usuario de prueba (signUp) y luego haga login automáticamente. Esto elimina la confusión de tener que registrarse manualmente.

Flujo del botón:
1. Rellena email y password
2. Intenta signUp (si ya existe, ignora el error)
3. Intenta signIn
4. Si funciona, navega a /admin

### 3. No se necesitan cambios en el panel admin

El panel ya existe en:
- `/admin` -- Lista de operaciones (crear, editar, eliminar, copiar link)
- `/admin/operations/:id` -- Editor completo con datos de operación, ofertas, vinculaciones y periodos mixtos

## Detalle tecnico

### Ficheros modificados
- Nueva migración SQL para limpiar y recrear las 8 políticas RLS
- `src/pages/Login.tsx` -- Botón de credenciales de prueba con auto-registro + login
