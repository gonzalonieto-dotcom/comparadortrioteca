

# TAE auto-calculada con logica financiera completa (IRR)

## Resumen

Convertir el campo TAE en el editor de ofertas a solo lectura, calculandose automaticamente en tiempo real usando la logica financiera existente (calculo IRR por biseccion). El mismo motor de calculo se usa tanto en el editor admin como en la vista del cliente, garantizando coherencia total.

## Que cambia para el gestor

- El campo "TAE estimada %" deja de ser editable y se muestra como valor calculado en tiempo real
- Al cambiar TIN, bonificaciones, gastos iniciales, coste de cuenta, o cualquier dato financiero, la TAE se recalcula instantaneamente
- La cuota mensual tambien se auto-calcula si se deja en 0 (ya implementado como hint, ahora se mostrara el valor real)
- Todo usa la misma formula IRR (Tasa Interna de Retorno) que es el estandar del Banco de Espana para calcular TAE

## Como funciona el calculo

La TAE se calcula mediante IRR (biseccion):
1. Se genera el cuadro de amortizacion completo (sistema frances) con el TIN bonificado
2. Se suman los costes mensuales adicionales (cuenta, vinculaciones) a cada cuota
3. Se calcula la tasa mensual que iguala el valor presente de todos los flujos al importe neto recibido (prestamo - gastos iniciales - tasacion)
4. Se anualiza: TAE = (1 + tasa_mensual)^12 - 1

## Detalle tecnico

### Archivo: `src/components/admin/OfferEditor.tsx`

Cambios principales:
- Importar `calcMonthlyPayment`, `calcEstimatedTAE`, `generateAmortizationSchedule` desde `mortgageCalc.ts`
- Crear funcion helper `toCalcOffer()` que convierte `OfferFormData` al tipo `Offer` que usa el motor de calculo
- Crear funcion helper `toCalcDefaults()` que construye `OperationDefaults` con `loanAmount` y `termYears` del props
- Usar `useMemo` para calcular en tiempo real:
  - `computedTAE`: resultado de `calcEstimatedTAE(offer, defaults, schedule)`
  - `computedPayment`: resultado de `calcMonthlyPayment(loanAmount, bonifiedTIN, termMonths)`
- Reemplazar el input TAE por un campo de solo lectura que muestra el valor calculado con formato `X.XX%`
- La cuota mensual se muestra como auto-calculada si el usuario deja 0, mostrando el valor real calculado

### Archivo: `src/pages/admin/OperationEditor.tsx`

- Pasar `appraisalCost` al OfferEditor (necesario para el calculo TAE completo)
- Al guardar, calcular y persistir la TAE y cuota automatica en la DB para que la vista cliente los tenga

### Flujo de datos

```text
OfferEditor (admin)
  |-- TIN, linkages, gastos --> toCalcOffer() --> Offer
  |-- loanAmount, termYears --> toCalcDefaults() --> OperationDefaults
  |-- calcMonthlyPayment() --> cuota mensual
  |-- generateAmortizationSchedule() --> schedule
  |-- calcEstimatedTAE(offer, defaults, schedule) --> TAE
  |-- Valores mostrados en tiempo real (read-only)
  |-- Al guardar: se persisten TAE y cuota calculados

ClientComparison (cliente)
  |-- Misma logica via computeOffer() --> coherencia total
```

### Mapeo de tipos OfferFormData a Offer

```text
OfferFormData.base_tin        --> Offer.baseTIN
OfferFormData.linkages[]      --> Offer.linkages[] (con isActive, discountWeightPct, annualCostEUR)
OfferFormData.upfront_costs   --> Offer.upfrontCostsEUR
OfferFormData.monthly_account_cost --> Offer.monthlyAccountCostEUR
OfferFormData.euribor_rate    --> Offer.euriborRate
OfferFormData.mixedPeriods    --> Offer.mixedPeriods
```

Nota: El `baseTIN` en el formulario ya es el TIN bonificado (lo que ingresa el gestor). Las vinculaciones se usan para calcular el "TIN sin bonificar" que es baseTIN + suma de pesos. Asi la TAE refleja correctamente el coste real incluyendo las bonificaciones.

