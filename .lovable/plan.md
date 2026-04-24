

## Plan: quitar seguros del operativo + visibilizar inflación en el desglose

### Parte 1 — Quitar seguros hogar/vida del panel "Datos de la operación"

Los seguros pertenecen a cada oferta (ya viven como bonificaciones con `annual_cost` por banco). Tenerlos también a nivel operativo provoca **doble contabilización** y confusión.

**Cambios**

1. **`src/pages/admin/OperationEditor.tsx`**
   - Eliminar los dos inputs "Seguro hogar €/año" y "Seguro vida €/año".
   - Quitar `home_insurance_annual` y `life_insurance_annual` del estado `op` y de la carga/guardado.
   - El grid de "Datos de la operación" pasa a 4 campos: Precio vivienda, Importe préstamo, Plazo, Inflación.

2. **`src/lib/mortgageCalc.ts`**
   - Eliminar la función `calcInsuranceCost` y los campos `insuranceCostWithInflation / insuranceCostNoInflation / totalInsuranceCost` de `ComputedOffer`.
   - `calcTotalCost` deja de sumar el seguro del operativo (solo intereses + bonificaciones inflactadas + cuenta + upfront + tasación).
   - `calcCumulativeCostByYear` deja de sumar `annualInsurance` (solo intereses + bonificaciones inflactadas + otros).

3. **Limpiar referencias** en `useOperation.ts`, `SharedOperation.tsx`, `OperationEditor.tsx` (el bloque de save), `InterestBarChart.tsx` (la barra "Bonificaciones + seguros" vuelve a llamarse "Bonificaciones") y mapeos de `OperationDefaults` (los dos campos quedan obsoletos — los dejamos en la interfaz pero siempre a 0, o los retiramos).
   - DB: `home_insurance_annual` y `life_insurance_annual` quedan en la tabla `operations` por compatibilidad con datos existentes pero el código deja de leerlos/escribirlos. No se borra columna para no romper imports históricos.

### Parte 2 — Mostrar la inflación año a año en "Coste total aproximado"

El cliente/gestor ve la card `CostBreakdown` por oferta con líneas: Intereses, Bonificaciones (con un texto chiquito "con inflación X%"). Pero **no se ve cómo crece** el coste de las bonificaciones año a año — solo el sumatorio plano.

**Cambios en `src/components/CostBreakdown.tsx`**

1. Recibir `inflationRate` y la lista de bonificaciones activas.
2. Bajo la línea "Bonificaciones (N activas)" añadir un **mini-desglose colapsable** (`Collapsible` ya existente) llamado **"Ver evolución por inflación"** que muestre una tabla pequeña con 4 hitos (Año 1, 10, 20, plazo final) por bonificación activa relevante (ej: seguro hogar, seguro vida):

   ```
   Seguro Hogar           Año 1      Año 10     Año 20     Año 30
                          240 €      287 €      343 €      410 €
   Seguro Vida            180 €      215 €      257 €      308 €
   ─────────────────────────────────────────────────────────────
   Total acumulado        420 €      5.230 €   13.840 €   28.700 €
   ```

3. Donde el cálculo es: para cada bonificación con `annualCostEUR > 0`, mostrar `cost * (1+inf)^(year-1)` en cada hito y un total acumulado `Σ cost * (1+inf)^i` desde año 0 hasta año Y-1.

4. Pasar `inflationRate` desde `Index.tsx` y `ClientComparison.tsx` (actualmente solo `SharedOperation.tsx` lo pasa).

5. Helper text: "Cada año el coste de tu seguro y otras bonificaciones sube un X% por inflación".

**`src/pages/Index.tsx`** y **`src/pages/ClientComparison.tsx`**: pasar `inflationRate={defaults.inflationRate ?? operationInflation}` al componente `CostBreakdown`.

### Parte 3 — Verificación lógica

- Confirmar que `calcTotalLinkageCost` sigue aplicando inflación compuesta correctamente sobre `annualCostEUR` de cada linkage activa (ya lo hace, líneas 105-118 de `mortgageCalc.ts`).
- Tras quitar `calcInsuranceCost`, los totales bajan en el monto que duplicaba — el coste real ahora coincide con la suma visible de las bonificaciones (incluidos seguros del banco).

### Resultado

- Panel del gestor más limpio: 4 campos en "Datos de la operación", los seguros se gestionan donde corresponden (en la oferta de cada banco como bonificaciones).
- "Coste total aproximado" deja de duplicar el seguro y muestra explícitamente la evolución año a año por inflación, justificando visualmente el peso del IPC en el cálculo.

