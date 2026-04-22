

## Plan: Sincronizar TIN bonificado y plazo con los periodos mixtos

### Problema

Cuando una oferta es **Mixta**, el gestor introduce el TIN bonificado del primer tramo y el plazo en los campos generales del editor. Estos valores **se copian una sola vez** al crear los periodos por defecto, pero después no se sincronizan: si el gestor cambia el TIN o el plazo, el "Desglose por tramo (auto-calculado)" sigue mostrando el valor anterior porque lee de `mixedPeriods`, que quedó desactualizado.

### Causa raíz

En `src/components/admin/OfferEditor.tsx`, la función `update()`:

- Solo crea los `mixedPeriods` por defecto cuando se cambia el tipo a "Mixto".
- No propaga cambios de `base_tin` al `fixed_tin` del primer tramo fijo.
- No propaga cambios de `term_years_override` al `to_year` del último tramo.

El componente `MixedPeriodEditor` muestra los valores actuales pero no sugiere los del menú general como placeholder/default.

### Cambios

**1. `src/components/admin/OfferEditor.tsx` — sincronización automática en `update()`**

Cuando la oferta es de tipo Mixto y existen periodos, propagar cambios:

- Si cambia `base_tin`: actualizar el `fixed_tin` del **primer tramo fijo** (el primero con `fixed_tin !== null`) al nuevo valor.
- Si cambia `term_years_override` (o `termYears` global): actualizar el `to_year` del **último tramo** al nuevo plazo en años.
- Si cambia `type` a algo distinto de "Mixto": dejar los periodos como están (no borrar) pero no aplicar la sincronización.

Esta sincronización solo se aplica cuando el gestor **no ha personalizado manualmente** esos campos en `MixedPeriodEditor`. Para mantenerlo simple y predecible, la sincronización se hace siempre que el tipo sea "Mixto" — el gestor puede sobreescribir manualmente después en el editor de periodos si lo desea, y a partir de ese momento el desglose reflejará lo que él configuró.

**2. `src/components/admin/MixedPeriodEditor.tsx` — sugerencias visuales**

Aceptar dos props nuevas opcionales: `suggestedFixedTIN` (= `offer.base_tin`) y `suggestedTermYears` (= plazo efectivo).

- En el input de "TIN fijo %": cuando el campo está vacío, mostrar como `placeholder` el valor sugerido (ej. `"1.50 (sugerido)"`).
- En el input de "Hasta año" del último tramo: mostrar como `placeholder` el plazo total sugerido.

Esto hace evidente para el gestor de dónde viene el valor y le permite confiar en los campos generales como fuente de verdad.

**3. Verificación del desglose**

Tras estos cambios, `calcPeriodBreakdown` (que ya consume `offer.mixedPeriods` actualizados) reflejará automáticamente los valores correctos en "Desglose por tramo (auto-calculado)" sin más cambios en `mortgageCalc.ts`.

### Resultado esperado

- Cambiar el TIN bonificado del primer tramo en el menú general actualiza al instante el desglose y el cálculo de cuota.
- Cambiar el plazo en años actualiza el rango del último tramo.
- El editor de periodos mixtos sugiere visualmente los valores de los campos generales como placeholders.

