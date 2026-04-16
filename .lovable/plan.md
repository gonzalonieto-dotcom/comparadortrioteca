

## Plan: Corregir seguros y aplicar inflación anual correctamente

### Problemas identificados

1. **Tooltips inventan datos de seguros**: El componente `InsuranceBasis` en `OfferTable.tsx` muestra texto inventado como "estimado para perfil estándar (edad 30-45, no fumador)". Los costes de seguros los ingresa el gestor como bonificaciones con coste anual — no hay que inventar descripciones.

2. **Inflación no se aplica al coste acumulado por año**: `calcCumulativeCostByYear` usa `annualLinkageCost * y` (lineal, sin inflación). Debería sumar año a año con inflación compuesta.

3. **`insuranceCostWithInflation` está mal calculado**: Línea 258 hace `totalLinkageCost - withoutInflation + withoutInflation` que es simplemente `totalLinkageCost` — no aporta nada.

### Cambios

**1. `src/components/OfferTable.tsx`**
- Eliminar el componente `InsuranceBasis` completo (líneas 44-62).
- En el popover de "Detalle costes" (línea 98), quitar la referencia a `<InsuranceBasis />`.
- En el popover de "MonthlyWithInsurance" (línea 119), reemplazar `<InsuranceBasis />` por un listado simple de las bonificaciones activas con coste > 0 (sin texto inventado).

**2. `src/lib/mortgageCalc.ts` — `calcCumulativeCostByYear`**
- Recibir `inflationRate` como parámetro adicional.
- Calcular el coste acumulado de bonificaciones por año con inflación compuesta: para cada año `y`, sumar `annualCost * (1+inf)^i` para `i=0..y-1`.
- Esto hará que el gráfico de línea refleje el coste real inflacionado.

**3. `src/lib/mortgageCalc.ts` — `insuranceCostWithInflation`**
- Corregir o eliminar este campo ya que actualmente no calcula nada útil.

**4. Callers de `calcCumulativeCostByYear`**
- Pasar `inflationRate` desde los componentes que llaman esta función (`InterestBarChart`, `Index`, `SharedOperation`, etc.).

