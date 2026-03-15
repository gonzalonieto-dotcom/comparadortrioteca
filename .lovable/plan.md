

## Cambios a realizar

### 1. Quitar "Puntos clave por banco" de la vista cliente
Eliminar la sección 9 (líneas 285-292) de `ClientComparison.tsx` que muestra `ConsiderationCards`. También eliminar el import de `ConsiderationCards`.

### 2. Mover "¿Y si ya estás valorando otra opción?" debajo del cuadro de amortización
Mover `BankChangeObjection` (actualmente sección 5, línea 233) para que aparezca después del `Collapsible` de amortización (después de línea 283).

### 3. Arreglar tooltips en móvil
Los tooltips de Radix (`@radix-ui/react-tooltip`) solo se activan con hover, que no existe en touch. La solución es convertir `InfoTooltip` en un componente que use `Popover` en lugar de `Tooltip` — los Popovers se abren con click/tap y funcionan en móvil.

**Cambio en `InfoTooltip.tsx`**: Reemplazar `Tooltip`/`TooltipTrigger`/`TooltipContent` por `Popover`/`PopoverTrigger`/`PopoverContent`. Esto hace que al tocar el icono ℹ️ en móvil se abra un popover, y en desktop sigue funcionando con click también (comportamiento consistente). No requiere cambios en ningún otro archivo ya que todos usan el componente centralizado.

### Orden final de secciones en ClientComparison:
1. Hero
2. Loan details
3. Enhanced recommended card
4. Why we recommend
5. Offer comparison table + External offer form
6. Cost breakdown
7. Amortization table
8. **BankChangeObjection** (movido aquí)
9. Decision summary
10. FAQ

