

# Cambios: ofertas externas read-only + logos de bancos

## 1. Oferta externa — comportamiento restringido

### `ExternalOfferForm.tsx`
- Al hacer submit, forzar `bankName` a **"Oferta externa"** independientemente de lo que diga el PDF o el campo manual. El campo de banco sigue editable para referencia del usuario pero no se usa como nombre final.

### `OfferTable.tsx` (desktop + mobile)
- Si `offer.isExternal === true`:
  - **No mostrar bonificaciones** interactivas (ni switches, ni popover de detalle costes) — solo listar como texto estático si las hay
  - **No mostrar botón "Avanzar"** — solo el botón de eliminar
  - Mantener el resto de datos visibles (TIN, TAE, cuota, comisión) para la comparación

### `RecommendedOffer.tsx`
- Si la oferta recomendada es externa, no mostrar la sección de bonificaciones interactivas

## 2. Logos de bancos — reemplazar nombre por imagen

Crear un mapa centralizado `BANK_LOGOS` en un nuevo archivo `src/lib/bankLogos.ts` con URLs públicas de logos para cada banco (CaixaBank, Ibercaja, BBVA, Kutxabank, Bankinter, Santander, etc.). Usar logos reales desde CDNs públicos (logo.clearbit.com o similares).

Crear un componente reutilizable `BankLogo` que:
- Recibe `bankName` y `logoColor`
- Si el banco tiene logo en el mapa → muestra `<img>` con el logo (altura ~20-24px)
- Si no tiene logo (oferta externa u otro) → muestra el dot de color + texto como ahora
- Fallback a dot+texto si la imagen falla

### Archivos a actualizar (reemplazar dot+nombre por `<BankLogo>`):
- `OfferTable.tsx` — celda "Banco" en desktop y header en mobile
- `RecommendedOffer.tsx` — nombre del banco
- `CostBreakdown.tsx` — header de cada card
- `InterestBarChart.tsx` — tooltips y leyenda del gráfico
- `ConsiderationCards.tsx` — header de cada card
- `AmortizationTable.tsx` — tabs de banco
- `OfferEditor.tsx` (admin) — header del card colapsable

## Archivos nuevos
- `src/lib/bankLogos.ts` — mapa de logos + componente `BankLogo`

## Archivos modificados
- `src/components/ExternalOfferForm.tsx`
- `src/components/OfferTable.tsx`
- `src/components/RecommendedOffer.tsx`
- `src/components/CostBreakdown.tsx`
- `src/components/InterestBarChart.tsx`
- `src/components/ConsiderationCards.tsx`
- `src/components/AmortizationTable.tsx`
- `src/components/admin/OfferEditor.tsx`

## Lo que NO cambia
- Backend, base de datos, edge functions — sin cambios
- Lógica de cálculo — sin cambios
- La oferta externa sigue siendo puramente local en el state del cliente

