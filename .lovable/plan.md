

## Asignar rol administrador a ricard.garriga@trioteca.com

### Situación
El usuario `ricard.garriga@trioteca.com` tiene `user_id = 83cf0d59-7dc6-4779-92f1-02e574e309d8` y actualmente no tiene ningún rol en la tabla `user_roles`.

### Acción
Insertar una fila en `user_roles` con:
- `user_id`: `83cf0d59-7dc6-4779-92f1-02e574e309d8`
- `role`: `admin`

### Método
Ejecutar un INSERT mediante la herramienta de base de datos. Una sola operación, sin cambios de código.

