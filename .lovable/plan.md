

# Plan: Corregir login y completar el data entry de ofertas

## Situacion actual

Las buenas noticias:
- Las politicas de seguridad (RLS) ya estan corregidas y son PERMISSIVE
- El usuario de prueba `gestor@trioteca.test` ya existe y esta confirmado
- El panel de administracion ya existe en `/admin` con editor de operaciones y ofertas
- El login deberia funcionar ahora con las credenciales de prueba

## Cambios necesarios

### 1. Agregar campos TAE estimada y Cuota mensual a las ofertas

El usuario pide poder ingresar TAE estimada y cuota por mes en cada oferta. Actualmente estos campos no existen en la tabla `offers`.

- Agregar columnas `estimated_tae` (numeric, default 0) y `monthly_payment` (numeric, default 0) a la tabla `offers`
- Actualizar el formulario `OfferEditor.tsx` para incluir estos dos campos
- Actualizar los tipos en `useOperation.ts` (`DbOffer`) para incluir los nuevos campos
- Actualizar el `upsertOffer` en `OperationEditor.tsx` para guardar estos campos

### 2. Simplificar el boton de login

Actualmente el boton "Acceder con credenciales de prueba" hace signup + signin. Como el usuario ya existe, simplificar para que solo haga signin y muestre un mensaje claro si falla. Tambien asegurar que el formulario normal de login funcione correctamente navegando a `/admin` tras el login.

### 3. Reorganizar los campos del editor de ofertas

Reordenar el formulario para que sea mas intuitivo con el flujo que pide el usuario:
- Banco y Tipo (primera fila)
- TIN bonificado, TAE estimada, Cuota mensual (segunda fila, datos financieros clave)
- Comision por amortizacion (tercera fila)
- Bonificaciones / Vinculaciones (seccion existente con Nomina, Seguro hogar, Seguro vida preconfiguradas)

## Detalle tecnico

### Migracion SQL
```sql
ALTER TABLE public.offers
  ADD COLUMN estimated_tae numeric NOT NULL DEFAULT 0,
  ADD COLUMN monthly_payment numeric NOT NULL DEFAULT 0;
```

### Ficheros a modificar
- `src/components/admin/OfferEditor.tsx` -- agregar campos TAE y cuota, reorganizar layout
- `src/hooks/useOperation.ts` -- agregar campos al tipo DbOffer y al mapeo
- `src/pages/admin/OperationEditor.tsx` -- incluir nuevos campos en upsert
- `src/pages/Login.tsx` -- simplificar el flujo de login para que funcione sin errores

### Flujo completo verificado
1. Gestor va a `/login` y hace clic en "Acceder con credenciales de prueba"
2. Se loguea y navega a `/admin`
3. Crea una nueva operacion (importe, precio vivienda, plazo)
4. Anade ofertas con banco, tipo, TIN, TAE, cuota, comision, bonificaciones
5. Guarda -- se genera ID y queda persistido en base de datos
6. Copia el link del cliente (`/op/:token`) que no se borra y siempre funciona
