
## Corregir checklist del modal y usar logos en la comparativa del front

### Lo que está pasando
La captura no coincide con el código actual que revisé:
- En `src/lib/bankChecklists.ts` Abanca ya está definido con 3 pasos y “Confirmar interés” primero.
- En `src/components/AdvanceModal.tsx` el modal renderiza los items en el orden recibido y bloquea los siguientes si el gatekeeper no está marcado.

Pero la UI que muestras sigue enseñando:
- pasos en otro orden
- un paso de CaixaBank dentro de Abanca (“Firmar documento SUA”)
- el diseño anterior del checklist

Eso indica que hay que **blindar la lógica del modal** para que siempre priorice el paso de interés y no arrastre estados/configuraciones de otro banco, además de revisar la vista cliente donde se muestran los bancos con texto en vez de logo.

### Propuesta de implementación

#### 1. Fortalecer el modal “Para avanzar con X banco”
Archivo: `src/components/AdvanceModal.tsx`

Haré estos ajustes:
- Memorizar el checklist resuelto por `bankName`
- Recalcular y resetear estados siempre al abrir modal o cambiar banco
- Forzar por código que el item con `isGatekeeper` se muestre primero, aunque el array venga desordenado
- Mantener bloqueados todos los pasos posteriores hasta marcar el interés como `OK`
- Revisar que Abanca no herede pasos de CaixaBank

Esto evita exactamente el problema que se ve en tu captura.

#### 2. Dejar Abanca con su checklist exacto
Archivo: `src/lib/bankChecklists.ts`

Abanca debe quedar solo con estos 3 pasos:
1. Confirmar interés del cliente
2. Apertura de cuenta
3. Documentación actualizada, completa y enviada al banco

Y siempre con el primero como gatekeeper.

#### 3. Poner logos en la comparativa del front como en el back
Archivo principal: `src/components/OfferTable.tsx`

Ahora el front ya usa `BankLogo`, pero muestra **logo + nombre**.  
La mejora sería:
- en la columna “Banco” mostrar **solo el logo** o logo con fallback visual más limpio
- mantener el nombre como `alt`, tooltip o texto accesible si hace falta
- aplicar esto tanto en desktop como mobile dentro de la comparativa

#### 4. Unificar también las tarjetas principales del front
Archivos:
- `src/components/client/EnhancedRecommendedCard.tsx`
- `src/components/client/DecisionSummary.tsx`

Si quieres consistencia total con el estilo “más friendly”, también cambiaría estas vistas para priorizar el logo visual del banco, no solo el texto.

### Resultado esperado
- En Abanca el modal mostrará únicamente sus 3 pasos correctos
- “Confirmar interés” aparecerá primero siempre
- Hasta marcar ese paso, el resto quedará bloqueado
- La comparativa del front mostrará los bancos con logos igual que en el back, con una presentación más visual y limpia

### Archivos a tocar
- `src/components/AdvanceModal.tsx`
- `src/lib/bankChecklists.ts`
- `src/components/OfferTable.tsx`
- opcional para consistencia visual:
  - `src/components/client/EnhancedRecommendedCard.tsx`
  - `src/components/client/DecisionSummary.tsx`

### Detalle técnico
La parte crítica no es solo el contenido de Abanca, sino asegurar que el modal no dependa de un estado previo ni de un orden accidental del array. La solución más robusta es:
- resolver checklist por banco
- ordenar gatekeeper primero
- reinicializar `statuses` con el checklist ya resuelto
- usar `BankLogo` con `showName={false}` en las vistas cliente donde quieras logo puro
