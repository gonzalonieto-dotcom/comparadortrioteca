

# Cambios en el editor de ofertas

## 1. Eliminar TAE del editor admin
- En `OfferEditor.tsx`: quitar el campo read-only "TAE estimada %" (líneas 197-208)
- Cambiar grid de 4 columnas a 3 columnas en esa fila (TIN bonificado, TIN sin bonificar, Cuota mensual)
- Se mantiene el cálculo de TAE en el frontend del cliente (`ClientComparison`)

## 2. Eliminar campo "Consideraciones"
- Quitar el textarea de consideraciones (líneas 266-273)
- Cambiar título de la card a "Ventajas y Vinculaciones"
- El campo `considerations` se mantiene en el tipo para no romper la DB

## 3. Tarjetas colapsables automáticas
- En `OperationEditor.tsx`: añadir estado `expandedIndex: number | null`
- Pasar props `expanded` y `onToggle` a cada `OfferEditor`
- En `OfferEditor.tsx`: convertir `expanded` de estado interno a prop controlada
- Al añadir oferta nueva → expandir solo la nueva, colapsar las demás

### Archivos a modificar
- `src/components/admin/OfferEditor.tsx`
- `src/pages/admin/OperationEditor.tsx`

