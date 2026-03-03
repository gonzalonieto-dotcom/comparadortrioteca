

# Cambios en el editor de ofertas

## 1. Eliminar campo "TIN sin bonificar" del UI
- Quitar el campo read-only (líneas 207-218 de OfferEditor.tsx)
- La lógica de conversión al guardar/cargar en OperationEditor.tsx se mantiene intacta (el motor de cálculo del cliente lo necesita internamente)
- Solo desaparece de la vista del gestor

## 2. PdfDropZone: estado persistente tras carga
- Después de extraer datos, en vez de volver a "idle" tras 3 segundos, mostrar permanentemente un estado "PDF cargado" con icono de check y nombre del archivo
- Permitir arrastrar otro PDF para reemplazar

## 3. Alinear campos del formulario
- Reorganizar la grid: fila 1 = Banco + Tipo (2 cols), fila 2 = TIN bonificado + Cuota mensual (2 cols), fila 3 = Comisión amort. + Gastos iniciales + Coste cuenta + Euríbor (4 cols)

## 4. Campos adaptativos para tipo Mixto
Cuando el tipo es "Mixto", los campos principales cambian:
- Label "TIN bonificado" → "TIN bonificado primer tramo"
- La cuota mensual se calcula con el TIN del tramo fijo (primer periodo)
- Nuevo campo editable: **"Diferencial sobre Euríbor"** (spread del tramo variable)
- El MixedPeriodEditor actual se simplifica o se alimenta desde estos campos
- El PDF extraction también intenta extraer el diferencial

## 5. Actualizar edge function parse-offer-pdf
- Añadir al prompt que extraiga el `spread_over_euribor` como "diferencial" para ofertas mixtas
- Ya existe en el schema de la tool, solo reforzar en el prompt

## Archivos a modificar
- `src/components/admin/OfferEditor.tsx` — quitar TIN sin bonificar, alinear grid, campos mixto
- `src/components/admin/PdfDropZone.tsx` — estado persistente "PDF cargado"
- `supabase/functions/parse-offer-pdf/index.ts` — reforzar extracción diferencial

