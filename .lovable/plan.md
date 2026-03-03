

# Bonificaciones visibles (read-only) + fila roja para ofertas externas

## Cambios en `src/components/OfferTable.tsx`

### 1. Mostrar bonificaciones en modo lectura para ofertas externas
Donde actualmente dice `"Solo lectura"` para `isExternal`, reemplazar por un listado estático de las bonificaciones (sin `Switch`, solo texto con un indicador visual tipo check/dot):
- Desktop: listar cada linkage como texto con su peso y coste, sin toggle
- Mobile: igual, reemplazar el texto "Solo lectura" por el listado estático

### 2. Pintar la fila de rojo clarito
- Desktop (`<tr>`): añadir `bg-red-50` (o `bg-destructive/5`) cuando `o.isExternal`
- Mobile (card container `<div>`): añadir `bg-red-50 border-red-200` cuando `o.isExternal`

## Archivos modificados
- `src/components/OfferTable.tsx` — solo este archivo

