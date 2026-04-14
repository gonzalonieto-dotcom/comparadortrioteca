

## Plan: Mejora del soporte de hipotecas mixtas + cálculo de seguros con inflación

### Contexto actual
El sistema ya soporta hipotecas mixtas con periodos definidos, cálculo de cuotas por tramos, y un editor de periodos mixtos. Sin embargo, la visualización para el cliente no diferencia claramente los costes por tramo (fijo vs variable), y los seguros se calculan con coste fijo sin tener en cuenta la inflación.

---

### 1. Mejorar el cálculo financiero para hipotecas mixtas

**Archivo: `src/lib/mortgageCalc.ts`**
- Añadir función `calcCostByPeriod()` que devuelva un desglose de intereses, cuota media y coste por cada tramo (ej: años 1-10 fijo, años 11-30 variable).
- Ampliar `ComputedOffer` con campos: `periodBreakdown: PeriodBreakdown[]` con cuota media, intereses y coste por tramo.
- Modificar `calcTotalCost()` para incorporar coste de seguros ajustado por inflación anual.

### 2. API de inflación española (Edge Function)

**Nuevo archivo: `supabase/functions/fetch-inflation/index.ts`**
- Scraping del IPC de España desde datosmacro.expansion.com/ipc-paises/espana (mismo patrón que `fetch-euribor`).
- Devuelve la tasa de inflación interanual actual.
- Fallback a un valor por defecto (ej: 3%) si no se puede extraer.

### 3. Incorporar inflación en el cálculo de seguros

**Archivo: `src/lib/mortgageCalc.ts`**
- Modificar `calcTotalLinkageCost()` para recibir un parámetro `inflationRate` opcional.
- Si se proporciona, el coste anual de cada vinculación se proyecta con inflación compuesta: `cost * Σ(1+inflation)^i` para cada año.
- Actualizar `calcTotalCost()`, `calcEstimatedTAE()` y `computeOffer()` para propagar el parámetro.

### 4. Vista del gestor — campos para mixtas

**Archivo: `src/components/admin/OfferEditor.tsx`**
- Cuando tipo = "Mixto": mostrar automáticamente 2 periodos por defecto (fijo + variable) si no existen.
- Mostrar la cuota del periodo fijo y la cuota estimada del periodo variable como campos auto-calculados de solo lectura.
- Añadir campo "Inflación anual estimada %" a nivel de operación.

**Archivo: `src/pages/admin/OperationEditor.tsx`**
- Añadir campo de inflación a los datos de la operación (con valor por defecto obtenido de la edge function).

### 5. Vista del cliente — comparativa de mixtas

**Archivo: `src/components/OfferTable.tsx`**
- Para ofertas mixtas: mostrar cuota del primer tramo y cuota estimada del segundo tramo con una etiqueta clara.
- Mostrar un badge "Cuota variable a partir del año X".

**Archivo: `src/components/CostBreakdown.tsx`**
- Añadir fila de desglose por tramo para ofertas mixtas: "Coste periodo fijo (años 1-10)" y "Coste periodo variable (años 11-30)".
- Incluir línea de "Coste seguros (con inflación)" como concepto separado.

**Archivo: `src/components/client/EnhancedRecommendedCard.tsx`**
- Para la oferta recomendada mixta: mostrar ambas cuotas (fijo y variable) con indicación clara del cambio de cuota.

**Archivo: `src/components/client/WhyWeRecommend.tsx`**
- Añadir razón específica para mixtas: "Cuota inicial más baja con posibilidad de amortizar antes del periodo variable".

### 6. Base de datos

- Añadir columna `inflation_rate` a la tabla `operations` (numeric, default 3.0, nullable).
- Migración SQL simple.

### 7. Actualizar `import-operation` Edge Function

**Archivo: `supabase/functions/import-operation/index.ts`**
- Aceptar campo `inflation_rate` en el payload de la API.

---

### Resumen técnico

| Componente | Cambio |
|---|---|
| `mortgageCalc.ts` | Desglose por tramo, inflación en seguros |
| `fetch-inflation/index.ts` | Nueva edge function |
| `OfferEditor.tsx` | Auto-crear periodos mixtos, cuotas por tramo |
| `OperationEditor.tsx` | Campo inflación |
| `OfferTable.tsx` | Cuotas por tramo en tabla |
| `CostBreakdown.tsx` | Desglose fijo/variable + seguros con inflación |
| `EnhancedRecommendedCard.tsx` | Cuotas mixtas |
| `WhyWeRecommend.tsx` | Razón para mixtas |
| `operations` (DB) | Columna `inflation_rate` |
| `import-operation` | Campo `inflation_rate` |

