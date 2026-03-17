

## Corrección de bugs y mejoras reportadas

### Bugs identificados y soluciones

#### 1. Valores se pierden al cambiar campos rápidamente (bug del dígito perdido)
**Causa raíz**: En `OperationEditor.tsx` línea 281-289, cada `onChange` captura `op` en un closure. Si cambias `purchase_price` y luego `loan_amount` rápido, el segundo cambio sobrescribe el primero porque usa el `op` viejo.

**Fix**: Cambiar todos los `setOp({ ...op, campo: valor })` a `setOp(prev => ({ ...prev, campo: valor }))` (actualización funcional).

#### 2. El cero no se borra al hacer clic en inputs numéricos
**Fix**: Agregar `onFocus={(e) => e.target.select()}` a todos los `<Input type="number">` en `OperationEditor.tsx` y `OfferEditor.tsx`. Así al hacer clic, se selecciona el contenido y al escribir se reemplaza.

#### 3. Linkages inactivas se muestran en el front del cliente (SharedOperation.tsx)
**Causa raíz**: En `SharedOperation.tsx` línea 72-80, se mapean TODAS las linkages sin filtrar por `is_active_default`. `ClientComparison.tsx` sí lo filtra (línea 58), pero `SharedOperation.tsx` no.

**Fix**: Agregar `.filter((l: any) => l.is_active_default)` en `SharedOperation.tsx` al igual que en `ClientComparison.tsx`.

#### 4. Coste total no considera todas las bonificaciones
**Causa raíz**: El cálculo es correcto en el motor (`calcBonifiedTIN` suma todos los descuentos activos). El problema real era que las linkages no se mostraban/activaban correctamente (bug #3). Con el fix de visibilidad, las bonificaciones activas se aplicarán al TIN y el coste total reflejará el descuento correcto.

#### 5. Cambio de pestaña del navegador borra datos
**Causa raíz**: Mismo bug que #1 — el stale closure. Los datos no se "borran" realmente, sino que se sobrescriben con valores antiguos al interactuar después de volver.

### Archivos a modificar

1. **`src/pages/admin/OperationEditor.tsx`** — Actualización funcional de `setOp` + `onFocus` select en inputs numéricos
2. **`src/pages/SharedOperation.tsx`** — Filtrar linkages por `is_active_default`
3. **`src/components/admin/OfferEditor.tsx`** — `onFocus` select en todos los inputs numéricos
4. **`src/components/admin/LinkageEditor.tsx`** — `onFocus` select en inputs numéricos

