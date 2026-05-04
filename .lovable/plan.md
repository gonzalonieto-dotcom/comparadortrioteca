## Problema

En el gráfico "Intereses vs bonificaciones" (componente `InterestBarChart`) y en `TotalCostChart`, el nombre del banco que aparece en el eje Y se abrevia tomando solo la **última palabra** del nombre:

```ts
name: co.offer.bankName.split(" ").pop()
```

Esto provoca renombrados incorrectos y peligrosos para el cliente:

- "Laboral Kutxa" → **"Kutxa"** (se confunde con Kutxabank, que es otro banco)
- "Global Caja" → **"Caja"**
- "Caixa Popular" → **"Popular"**
- "Banco Santander" → **"Santander"** (este sí es aceptable)

Verificado en BD: en `offers.bank_name` los nombres están bien guardados como "Laboral Kutxa" y "Kutxabank" — el bug es puramente de presentación en los charts.

## Solución

Mostrar el **nombre completo** del banco en el eje Y de los gráficos, ajustando el ancho del eje para que quepa sin solaparse.

### Cambios

**1. `src/components/InterestBarChart.tsx`** (línea 32)
- Cambiar `name: co.offer.bankName.split(" ").pop()` por `name: co.offer.bankName`.
- Aumentar el `width` del `<YAxis>` (de su valor actual a ~110-120) para acomodar nombres largos como "Laboral Kutxa" o "Caixa Popular".
- Revisar las otras pestañas del mismo componente (líneas 182, 187, 273, 345, 347) por si replican la abreviación; el `Tooltip` y `Legend` ya usan `bankName` completo, así que solo afecta al eje.

**2. `src/components/TotalCostChart.tsx`** (línea 15)
- Mismo cambio: `name: o.banco` en vez de `o.banco.split(" ").pop()`.
- Aumentar `width` del `<YAxis>` de 80 a ~110.

**3. Sin cambios** en `BankLogo` ni en `bankLogos.tsx`: el favicon de `laboralkutxa.com` ya es el correcto y distinto del de `kutxabank.es`.

### QA

Comprobar visualmente en una comparativa que incluya "Laboral Kutxa" (existen 4 ofertas en BD) que en los gráficos del cliente aparece el nombre completo y no se confunde con "Kutxabank".
