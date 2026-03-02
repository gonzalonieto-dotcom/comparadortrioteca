

# Rediseno del editor de ofertas bancarias

## Resumen

Reorganizar el formulario de creacion/edicion de ofertas para simplificar el flujo del gestor: bancos preseleccionados con colores predefinidos, vinculaciones fijas, campos auto-calculados, Euribor automatico desde Expansion, y mejor organizacion visual.

## Cambios principales

### 1. Banco como selector predefinido (no texto libre)
- Reemplazar el input de texto "Banco" por un `Select` con opciones fijas:
  - CaixaBank - `hsl(200, 70%, 40%)`
  - Ibercaja - `hsl(340, 75%, 45%)`
  - BBVA - `hsl(210, 80%, 45%)`
  - Kutxabank - `hsl(145, 60%, 40%)`
  - Bankinter - `hsl(25, 90%, 50%)`
- Al seleccionar un banco, el color se asigna automaticamente (campo oculto)
- El campo "Color (HSL)" desaparece del formulario

### 2. Campo "Orden" oculto
- Eliminar el input de orden del formulario
- El `sort_order` se asignara automaticamente segun el indice en el array

### 3. TAE y Cuota con auto-calculo
- Si TAE o cuota mensual quedan en 0, se calculan automaticamente usando la logica existente en `mortgageCalc.ts` (`calcEstimatedTAE`, `calcMonthlyPayment`)
- Los campos siguen siendo editables para override manual
- Se mostrara un texto "(auto)" junto al label cuando el valor es 0 o esta vacio

### 4. Euribor automatico desde Expansion
- Crear una edge function `fetch-euribor` que hace scraping de la pagina de Expansion para obtener la ultima cotizacion del Euribor
- El campo Euribor se pre-rellena automaticamente al cargar el editor
- Sigue siendo editable para override manual

### 5. Ventajas y Consideraciones en tarjeta separada
- Mover los textareas de ventajas y consideraciones a una segunda `Card` debajo de los datos financieros
- Titulo: "Ventajas y Consideraciones"

### 6. Vinculaciones predefinidas (no texto libre)
- Reemplazar el sistema actual de "Anadir vinculacion libre" por 3 vinculaciones fijas:
  - Domiciliacion de nomina
  - Seguro hogar
  - Seguro de vida
- Cada una siempre aparece con su label fijo (no editable)
- Los campos de peso (%) y coste (EUR/ano) siguen siendo inputs manuales
- El switch de activa/inactiva se mantiene
- Se elimina el boton de "Anadir" y "Eliminar" vinculacion

## Detalle tecnico

### Archivos a modificar

1. **`src/components/admin/OfferEditor.tsx`** - Cambios principales:
   - Mapa de bancos con colores: `BANK_PRESETS`
   - Select de banco en lugar de Input
   - Ocultar campo color y orden
   - Pasar datos de operacion para auto-calculo de TAE/cuota

2. **`src/components/admin/LinkageEditor.tsx`** - Refactor completo:
   - 3 filas fijas (nomina, seguro hogar, seguro vida)
   - Sin botones de anadir/eliminar
   - Label no editable, solo peso y coste editables

3. **`src/pages/admin/OperationEditor.tsx`** - Ajustes menores:
   - Pasar `loanAmount` y `termYears` al OfferEditor para auto-calculo
   - Pre-cargar Euribor al montar el componente

4. **`supabase/functions/fetch-euribor/index.ts`** - Nueva edge function:
   - Hace fetch de la pagina de Expansion
   - Extrae el valor actual del Euribor con regex
   - Retorna `{ euribor: number }`

### Constante de bancos predefinidos

```text
BANK_PRESETS = {
  "CaixaBank":  { color: "hsl(200, 70%, 40%)" },
  "Ibercaja":   { color: "hsl(340, 75%, 45%)" },
  "BBVA":       { color: "hsl(210, 80%, 45%)" },
  "Kutxabank":  { color: "hsl(145, 60%, 40%)" },
  "Bankinter":  { color: "hsl(25, 90%, 50%)" },
}
```

### Vinculaciones fijas

```text
PRESET_LINKAGES = [
  { label: "Domiciliacion de nomina" },
  { label: "Seguro hogar" },
  { label: "Seguro de vida" },
]
```

### Edge function fetch-euribor
- Hace fetch de `https://www.expansion.com/mercados/tipos-interes/euribor.html`
- Extrae el valor numerico del Euribor con un patron regex
- Cachea el resultado para no hacer multiples requests en la misma sesion

