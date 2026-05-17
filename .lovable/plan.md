## Problema

Al hacer clic en los inputs numéricos del comparador (tanto en el editor del gestor como en el frontend del cliente), el "0" inicial no se selecciona, obligando a borrarlo manualmente antes de escribir el valor deseado.

Algunos inputs ya tienen `onFocus={(e) => e.target.select()}` (OperationEditor, OfferEditor, LinkageEditor), pero faltan en:
- `src/components/ExternalOfferForm.tsx` (frontend cliente)
- `src/components/InterestBarChart.tsx` (amortizaciones parciales)
- `src/components/TotalCostChart.tsx`
- `src/components/admin/MixedPeriodEditor.tsx`

## Solución

Centralizar el comportamiento en el componente base `src/components/ui/input.tsx`: cuando `type === "number"`, aplicar automáticamente `select()` en el evento `onFocus`, respetando cualquier `onFocus` que el padre pase (se ejecutan ambos).

Esto garantiza que **todos** los inputs numéricos actuales y futuros tengan el mismo UX, alineado con la regla del proyecto ("Numeric inputs auto-select on focus") y sin tocar los inputs de texto.

### Cambios técnicos

- `src/components/ui/input.tsx`: en el forwardRef, envolver `onFocus` para que, si `type === "number"`, llame a `e.target.select()` antes/después del handler del padre.

Sin migraciones de DB ni cambios de lógica.
