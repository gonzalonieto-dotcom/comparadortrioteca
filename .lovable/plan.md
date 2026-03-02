

# Plan: MVP Comparador Hipotecario End-to-End

## Resumen

Reutilizar la infraestructura existente (tablas `operations`, `offers`, `offer_linkages`) y el front del comparador (`SharedOperation.tsx`, `mortgageCalc.ts`) para construir el flujo completo gestor-cliente. Los cambios principales son: agregar campo `is_published`, crear Edge Function para lectura publica segura, corregir las politicas RLS, y reorganizar rutas.

## Cambios

### 1. Migracion SQL

- Agregar columna `is_published boolean NOT NULL DEFAULT false` a `operations`
- Eliminar TODAS las politicas RLS existentes (son RESTRICTIVE, lo cual bloquea el acceso)
- Recrear politicas como PERMISSIVE:
  - `operations`: SELECT publico si `share_token IS NOT NULL`, ALL para gestor autenticado dueño
  - `offers`: SELECT publico, ALL para gestor dueño via subquery
  - `offer_linkages` y `offer_mixed_periods`: idem

### 2. Edge Function `get-comparison`

Crear `supabase/functions/get-comparison/index.ts`:
- Input: `{ token: string }`
- Usa service role key para consultar sin RLS
- Busca `operations` por `share_token` donde `is_published = true`
- Si no existe o no publicada: 404 con mensaje amigable
- Devuelve operation + offers + linkages + mixed_periods en JSON
- CORS habilitado
- `verify_jwt = false` en config.toml

### 3. Ruta cliente `/c/:token`

Crear `src/pages/ClientComparison.tsx`:
- Llama a la Edge Function `get-comparison` con el token
- Mapea la respuesta al shape `OperationDefaults` + `Offer[]` (misma estructura que ya usa el front)
- Renderiza el mismo UI que `SharedOperation.tsx` pero con datos de la Edge Function
- `LoanHeader` en modo solo lectura (ya lo es)
- Si error/no publicada: muestra mensaje de error claro

### 4. Rutas admin

- `/admin/login` -> pagina Login (mover de `/login`)
- `/admin/dashboard` -> lista de comparativas (actualmente en `/admin`)
- `/admin/dashboard/:id` -> editor de operacion (actualmente en `/admin/operations/:id`)

### 5. Dashboard gestor (`Operations.tsx`)

Agregar:
- Columna "Estado" (Publicada/Borrador) en la tabla
- Boton publicar/despublicar por operacion
- El link solo se puede copiar si esta publicada
- Mostrar el link `/c/:token` en lugar de `/op/:token`

### 6. Editor de operacion (`OperationEditor.tsx`)

- Limitar a maximo 5 ofertas (deshabilitar boton "Anadir oferta" si ya hay 5)
- Agregar toggle de publicacion en el header
- Simplificar campos de operacion a los 3 que pide el usuario: importe prestamo, precio vivienda, plazo (mantener los demas en BD con defaults)

### 7. Login (`Login.tsx`)

- Mover a ruta `/admin/login`
- Boton de credenciales de prueba hace solo `signIn` directo
- Redirige a `/admin/dashboard` tras login exitoso

### 8. Actualizar `App.tsx`

```text
/c/:token          -> ClientComparison (publico)
/admin/login       -> Login
/admin/dashboard   -> Operations (protegido)
/admin/dashboard/:id -> OperationEditor (protegido)
/                  -> redirige a /admin/login
```

## Detalle tecnico

### Shape de datos (sin cambios en el front)

La Edge Function devuelve datos que se mapean a:
- `OperationDefaults` (purchasePrice, loanAmount, termYears, etc.)
- `Offer[]` con `linkages: Linkage[]` y `mixedPeriods: MixedRatePeriod[]`

Esto alimenta `computeOffer()` que calcula TIN bonificado, cuota, TAE, coste total -- toda la logica existente sin modificaciones.

### Ficheros a crear
- `supabase/functions/get-comparison/index.ts`
- `src/pages/ClientComparison.tsx`

### Ficheros a modificar
- `supabase/config.toml` (agregar config de edge function -- nota: NO se edita manualmente, se gestiona via herramientas)
- `src/App.tsx` (rutas)
- `src/pages/admin/Operations.tsx` (publicar/despublicar, link `/c/:token`)
- `src/pages/admin/OperationEditor.tsx` (limite 5 ofertas, toggle publicacion, simplificar campos)
- `src/pages/Login.tsx` (redirigir a `/admin/dashboard`)
- `src/hooks/useOperation.ts` (agregar `is_published` al tipo, funcion para toggle)

### Ficheros sin cambios
- `src/lib/mortgageCalc.ts` -- toda la logica de calculo intacta
- `src/components/RecommendedOffer.tsx` -- logica de recomendacion intacta
- `src/components/OfferTable.tsx`, `CostBreakdown.tsx`, etc. -- UI intacta

