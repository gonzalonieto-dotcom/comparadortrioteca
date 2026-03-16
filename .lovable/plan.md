

## Panel de administración de gestores

### Problema
No existe forma de administrar qué usuarios pueden registrarse y operar como gestores. Cualquiera que se registre tiene acceso completo.

### Solución

#### 1. Base de datos: tabla `user_roles` + función `has_role`

Crear un enum `app_role` (`admin`, `gestor`) y una tabla `user_roles` con RLS. Crear la función `has_role` como `SECURITY DEFINER` para evitar recursión en políticas RLS.

Asignar el rol `admin` al usuario `gonzalo.nieto@trioteca.com` mediante su `user_id` (se busca en la migración con un bloque DO que consulte `auth.users`).

Agregar política SELECT pública en `user_roles` para que los usuarios autenticados puedan consultar su propio rol, y política ALL para admins.

#### 2. Nuevas políticas RLS en `operations`

Añadir una política SELECT para admins que puedan ver todas las operaciones (para el panel de gestión). Las políticas existentes de gestores no se tocan.

#### 3. Nueva página: `/admin/users` — Panel de gestión de usuarios

- Lista todos los usuarios con rol `gestor` (consultando `user_roles` + datos del auth vía una función RPC o vista)
- Botones para eliminar gestores (elimina su rol, no la cuenta auth)
- Formulario para invitar/crear nuevos gestores
- Solo accesible si el usuario tiene rol `admin`

Dado que no podemos consultar `auth.users` desde el cliente, crearemos una **edge function** `list-gestors` que use el service role key para listar usuarios con rol gestor, y otra `manage-gestor` para crear/eliminar.

#### 4. Hook `useRole` 

Un hook que consulta `user_roles` para el usuario actual y expone `isAdmin` / `isGestor`.

#### 5. Routing y navegación

- Nueva ruta `/admin/users` en `App.tsx`
- En `Operations.tsx`, mostrar link al panel de usuarios si el usuario es admin
- Proteger `/admin/users` para que solo admins accedan

#### 6. Login

- Quitar las credenciales de prueba hardcodeadas del login
- El usuario `gonzalo.nieto@trioteca.com` debe estar registrado previamente — si no existe, se le pedirá que se registre y luego la migración le asigna el rol admin automáticamente

### Flujo de la migración SQL

```sql
CREATE TYPE public.app_role AS ENUM ('admin', 'gestor');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function
CREATE FUNCTION public.has_role(...) ...;

-- RLS policies for user_roles
-- Authenticated users can read their own roles
-- Admins can manage all roles

-- Assign admin to gonzalo.nieto@trioteca.com
DO $$ ... INSERT INTO user_roles ... $$;
```

### Edge functions

- **`list-gestors`**: GET — usa service role para listar usuarios con rol gestor (join user_roles + auth.users para obtener email)
- **`manage-gestor`**: POST — crear usuario o eliminar rol. Solo admins (verificado server-side)

### Archivos nuevos
- `src/pages/admin/UserManagement.tsx` — Panel de gestión
- `src/hooks/useRole.ts` — Hook para verificar rol
- `supabase/functions/list-gestors/index.ts`
- `supabase/functions/manage-gestor/index.ts`

### Archivos modificados
- `src/App.tsx` — nueva ruta
- `src/pages/admin/Operations.tsx` — link al panel si es admin
- `src/pages/Login.tsx` — quitar credenciales hardcodeadas

