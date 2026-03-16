

## Problema

Tu cuenta `gonzalo.nieto@trioteca.com` existe (user_id: `3e770a77-eabb-418b-9f73-81da64214904`) pero la contraseña almacenada no coincide con la que estás usando. Probablemente fue creada con una contraseña diferente antes de que configuráramos el panel.

## Solución

Resetear la contraseña usando la API de administrador del backend.

### Pasos

1. **Crear una edge function temporal** `reset-admin-pw` que use el service role key para actualizar la contraseña del usuario admin (`3e770a77-eabb-418b-9f73-81da64214904`) a `Benja@0508` usando `auth.admin.updateUserById()`.

2. **Invocar la función** para que se ejecute el reset.

3. **Eliminar la función temporal** una vez reseteada la contraseña (por seguridad).

4. **Agregar acción "reset_password"** al `manage-gestor` existente para que en el futuro puedas resetear contraseñas de gestores desde el panel de usuarios sin necesidad de intervención técnica.

### Cambios en archivos

- **Nuevo temporal**: `supabase/functions/reset-admin-pw/index.ts` (se elimina después)
- **Editado**: `supabase/functions/manage-gestor/index.ts` — agregar acción `reset_password`
- **Editado**: `src/pages/admin/UserManagement.tsx` — agregar botón para resetear contraseña de un gestor

