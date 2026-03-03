

# Incorporar oferta externa (PDF + manual) en vista del cliente

## Qué hacer
Añadir en `ClientComparison.tsx` el componente `ExternalOfferForm` mejorado para que el cliente pueda:
1. **Arrastrar un PDF** de su oferta bancaria → se extraen datos automáticamente vía la edge function existente `parse-offer-pdf`
2. **Rellenar a mano** los campos como ya funciona hoy

La oferta se añade al estado local `offers[]` y se recalcula la comparativa. No se guarda en base de datos ni afecta al panel del gestor — es puramente client-side para que el cliente vea si su oferta es mejor o peor.

## Cambios

### 1. `src/components/ExternalOfferForm.tsx`
- Añadir una mini dropzone (reutilizando la lógica de `PdfDropZone` pero simplificada) dentro del formulario, arriba de los campos manuales
- Al soltar un PDF, llamar a `parse-offer-pdf` y pre-rellenar los campos del formulario (banco, TIN, tipo, bonificaciones)
- El cliente puede luego ajustar manualmente antes de confirmar
- Mantener el flujo manual intacto como alternativa

### 2. `src/pages/ClientComparison.tsx`
- Importar `ExternalOfferForm`
- Añadir handler `handleAddExternalOffer` que agrega la oferta al estado `offers`
- Renderizar el componente debajo de la tabla de ofertas
- ~10 líneas de código nuevo

### Lo que NO cambia
- Backend: sin nuevas tablas, sin migraciones
- Panel del gestor: sin cambios
- Edge function `parse-offer-pdf`: se reutiliza tal cual
- La oferta externa solo vive en el state local del cliente

