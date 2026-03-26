

## Plazo personalizable por oferta

### Enfoque

Tu idea es correcta: mantener el plazo global de la operación como valor por defecto, pero permitir que cada oferta individual pueda tener un plazo diferente. Así podés comparar la misma hipoteca a 20, 25 y 30 años dentro de una misma comparativa.

### Cambios

#### 1. Base de datos: nueva columna `term_years` en `offers`

Agregar una columna nullable `term_years integer` en la tabla `offers`. Si es `NULL`, la oferta usa el plazo global de la operación. Si tiene valor, usa ese plazo específico.

#### 2. Admin — `OfferEditor.tsx`: campo de plazo por oferta

Agregar un campo "Plazo (años)" en cada oferta con placeholder mostrando el valor global (ej: "30 — global"). Si el gestor lo deja vacío, hereda el global. Si pone un número, esa oferta se calcula con ese plazo.

Agregar `term_years_override: number | null` al `OfferFormData`.

#### 3. Admin — `OperationEditor.tsx`: usar plazo de oferta en cálculos

En `handleSave`, al calcular TAE/cuota, usar `offer.term_years_override ?? op.term_years` en lugar de `op.term_years` fijo. Pasar también este valor al `OfferEditor` y al guardar en DB.

#### 4. Cliente — `ClientComparison.tsx` y `SharedOperation.tsx`

Al construir cada `Offer` para el motor de cálculo, leer `offer.term_years ?? operation.term_years` y usar ese plazo individual. Mostrar el plazo en la tabla de comparación si difiere del global.

#### 5. Motor de cálculo

No necesita cambios — ya recibe `termYears` como parámetro por oferta vía `OperationDefaults`. Solo hay que pasar el valor correcto desde los componentes.

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| Migración SQL | `ALTER TABLE offers ADD COLUMN term_years integer DEFAULT NULL` |
| `src/components/admin/OfferEditor.tsx` | Nuevo campo plazo con placeholder del global |
| `src/pages/admin/OperationEditor.tsx` | Usar plazo por oferta en cálculos y guardado |
| `src/pages/ClientComparison.tsx` | Leer `term_years` de cada oferta |
| `src/pages/SharedOperation.tsx` | Idem |
| `src/components/OfferTable.tsx` | Mostrar plazo si difiere del global |

### Resultado

- El gestor configura plazo global (ej: 30 años) como siempre
- Puede sobrescribir el plazo en cualquier oferta individual (ej: una a 20 años, otra a 25)
- Cuota, TAE y tabla de amortización se recalculan con el plazo específico
- El cliente ve claramente qué plazo tiene cada oferta

