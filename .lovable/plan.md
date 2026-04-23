

## Plan: Inflación en seguros + simplificar mixta a 2 tramos

### Parte 1 — Aplicar inflación a los seguros del operativo

**Problema actual**
Los seguros (`home_insurance_annual`, `life_insurance_annual`) se guardan en la operación pero **no se incluyen en `calcTotalCost`** del motor. La inflación solo se aplica a las "bonificaciones" (linkages) que el gestor añade manualmente por oferta. Resultado: el toggle de inflación no afecta nada relacionado a los seguros del operativo.

**Cambios**

1. `src/lib/mortgageCalc.ts`
   - Nueva función `calcInsuranceCostWithInflation(defaults, inflationRate)` que calcula la suma de `(homeInsuranceAnnualDefault + lifeInsuranceAnnualDefault) * (1+inf)^i` para `i = 0..termYears-1`.
   - `calcTotalCost` suma este valor al total.
   - `computeOffer` devuelve `insuranceTotalWithInflation` y `insuranceTotalNoInflation` por separado, para poder mostrar el delta.
   - `calcCumulativeCostByYear` incluye los seguros con inflación compuesta año a año en la curva acumulada.

2. **Visualización del cliente** (`InterestBarChart` y vista cliente)
   - El gráfico actual separa "Intereses" vs "Bonificaciones". Añadir/renombrar el segundo bloque a **"Bonificaciones + seguros (con inflación)"** mostrando claramente el sumatorio inflado de seguros del operativo.
   - Tooltip explicando: "Incluye seguros anuales ajustados por una inflación del X% anual".

3. **Edge function `fetch-inflation`**
   - La estructura ya permite actualización diaria: cache de 24h en `cached_rates`, scrapping desde datosmacro. **No requiere cambios estructurales.**
   - Mejora: el regex actual puede captar valores incorrectos (mismo problema que tuvo Euríbor). Endurecer patrones para extraer específicamente el "IPC interanual España" más reciente (actualmente ~2.6%) y añadir un patrón secundario al INE como fuente de respaldo.
   - Reducir TTL a 24h (ya está) — el dato real solo se publica una vez al mes, así que diario es suficiente.

4. **OperationEditor** (admin)
   - Mostrar al lado del campo "Inflación %" un texto pequeño: "Auto-actualizado desde fuente oficial (IPC interanual España: X.X%)" y un botón "Refrescar" que invoque la edge function.

---

### Parte 2 — Simplificar la mixta a 2 tramos

**Estado actual**
El editor muestra: TIN bonificado, plazo, diferencial sobre Euríbor, **toggle de sincronización**, **lista completa de "Periodos mixtos"** editables (`MixedPeriodEditor`) y **"Desglose por tramo (auto-calculado)"**. Es redundante y confuso.

**Nueva UX para Mixto**

El gestor solo verá **tres campos** (todo lo demás se calcula):
- **TIN bonificado primer tramo %** (ya existe)
- **Años del tramo fijo** (nuevo input simple, ej: `10`) — define el punto de quiebre
- **Diferencial sobre Euríbor %** (ya existe)

El plazo total sigue siendo el del campo "Plazo (años)" general de la oferta.

**Cambios concretos en `OfferEditor.tsx`**

1. **Eliminar de la UI del modo Mixto**:
   - El componente `MixedPeriodEditor` completo.
   - El toggle "Sincronizar con campos generales".
   - El bloque "Desglose por tramo (auto-calculado)".
   - El warning de `mixedMismatch` (queda obsoleto al no haber edición manual posible).

2. **Añadir un único nuevo campo** "Años tramo fijo" (default: 10) junto a "Diferencial sobre Euríbor".

3. **Construcción interna de `mixedPeriods`**: cada vez que cambia `base_tin`, `term_years_override`, `años tramo fijo` o `diferencial`, se reconstruye `mixedPeriods` siempre con exactamente 2 entradas:
   ```
   [
     { from_year: 1, to_year: fixedYears, fixed_tin: base_tin, spread_over_euribor: null },
     { from_year: fixedYears + 1, to_year: termYears, fixed_tin: null, spread_over_euribor: spread }
   ]
   ```

4. **Persistencia**: la tabla `offer_mixed_periods` y `MixedRatePeriod` no cambian — seguimos guardando 2 filas. El motor (`mortgageCalc.ts`) sigue funcionando exactamente igual.

5. **Eliminar el archivo** `src/components/admin/MixedPeriodEditor.tsx` (ya no se usa) y limpiar imports.

6. **Migración silenciosa de ofertas existentes**: al cargar una oferta Mixto desde la BD, derivar `años tramo fijo` del primer periodo (`to_year` del primer tramo con `fixed_tin`). Si tiene >2 tramos, colapsar al esquema de 2 (primer tramo fijo encontrado + último tramo variable) y mostrar un toast de aviso.

---

### Resultado

- **Inflación en seguros**: se suma al coste total y se ve en el desglose; valor IPC actualizado diariamente desde fuente oficial.
- **Mixta**: el gestor solo introduce 3 datos (TIN, años fijos, diferencial). Cero edición de tramos manual, cero desincronización posible.

