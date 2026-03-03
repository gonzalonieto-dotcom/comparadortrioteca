

# Corregir lógica TIN bonificado / sin bonificar

## Problema actual

Hay una inconsistencia en cómo se maneja el TIN:

- **Admin (OfferEditor)**: El gestor ingresa el TIN bonificado (ej: 2.30%). El editor suma los descuentos para reconstruir el baseTIN del motor (2.30 + 0.70 = 3.00%). Esto está correcto internamente.
- **Cliente (ClientComparison)**: Se lee `base_tin` de la DB (2.30%) y se pasa directo como `baseTIN` al motor. El motor luego **resta** los descuentos de las bonificaciones activas → resultado: 2.30 - 0.70 = 1.60%. **Esto está mal.** Debería quedar 2.30% con bonificaciones activas, y 3.00% sin ellas.

## Solución

### 1. Guardar el TIN sin bonificar en la DB

Al guardar en `OperationEditor.tsx`, persistir `base_tin = offer.base_tin + totalDiscount` (el TIN sin bonificar, que es lo que el motor espera como `baseTIN`). Así el cliente recibe el valor correcto.

Cambio en línea 169: `base_tin: offer.base_tin + totalDiscount` en vez de `base_tin: offer.base_tin`.

### 2. Al cargar en el admin, reconstruir el TIN bonificado

En `loadData()` del OperationEditor, cuando se cargan las ofertas de la DB, restar los descuentos activos para mostrar el TIN bonificado al gestor:

`base_tin: dbOffer.base_tin - SUM(linkage discounts activos)`

### 3. Mostrar campo "TIN sin bonificar" (read-only) en el editor

Añadir un campo auto-calculado en `OfferEditor.tsx` que muestre `TIN bonificado + SUM(descuentos activos)` para que el gestor vea ambos valores.

### 4. El cliente ya funciona correctamente

Con el TIN sin bonificar guardado en la DB, `ClientComparison.tsx` línea 42 (`baseTIN: o.base_tin`) pasa el valor correcto al motor. Cuando el cliente desactiva una bonificación, el motor calcula `baseTIN - descuentos_restantes`, subiendo el TIN como se espera.

## Archivos a modificar

### `src/pages/admin/OperationEditor.tsx`
- **Guardar**: cambiar `base_tin: offer.base_tin` → `base_tin: offer.base_tin + totalDiscount`
- **Cargar**: al leer ofertas de DB, restar descuentos activos del `base_tin` para mostrar el bonificado

### `src/components/admin/OfferEditor.tsx`
- Añadir campo read-only "TIN sin bonificar %" que muestra `base_tin + SUM(descuentos activos)`
- El campo existente "TIN bonificado %" sigue siendo editable

## Flujo corregido

```text
Admin ingresa: TIN bonificado = 2.30%, nómina = 0.70pp
  → Se muestra: TIN sin bonificar = 3.00% (auto)
  → Se guarda en DB: base_tin = 3.00% (sin bonificar)

Cliente recibe: baseTIN = 3.00% del motor
  → Bonificaciones activas (0.70pp) → TIN efectivo = 2.30% ✓
  → Cliente apaga nómina → TIN efectivo = 3.00% ✓
```

