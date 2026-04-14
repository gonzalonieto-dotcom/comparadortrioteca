

## Plan: Campos mixtos en oferta externa + corrección tooltip del gráfico

### 1. Campos de periodos mixtos en ExternalOfferForm

**Archivo: `src/components/ExternalOfferForm.tsx`**

Cuando el usuario selecciona tipo "Mixto", mostrar campos adicionales:
- **TIN fijo primer tramo %** (ya cubierto por el campo TIN base existente, solo cambiar la etiqueta)
- **Años periodo fijo** (ej: 10)
- **Diferencial sobre Euríbor %** (para el periodo variable)

Al hacer submit, construir el array `mixedPeriods` en el objeto `Offer` con los dos tramos correspondientes. Esto permite que los cálculos de coste por tramo funcionen correctamente para ofertas externas mixtas.

### 2. Corrección del tooltip en el gráfico de barras

**Archivo: `src/components/InterestBarChart.tsx`**

Línea 50: el formatter compara `name === "interest"` pero los nombres de las barras son `"Intereses"` y `"Bonificaciones"` (definidos en las props `name` de `<Bar>`). Corregir la condición para que use los nombres correctos:
- `name === "Intereses"` → mostrar "Intereses totales"
- `name === "Bonificaciones"` → mostrar "Coste de bonificaciones"

