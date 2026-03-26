

## Checklist personalizado por banco en el modal "Avanzar"

### Situación actual
El `AdvanceModal` tiene un checklist genérico hardcodeado para todos los bancos. Se necesita uno específico por banco, empezando por CaixaBank.

### Checklist CaixaBank (según tu descripción)

| # | Paso | Comportamiento |
|---|---|---|
| 1 | Confirmar interés | Botón "OK" / "Pendiente". Al dar OK se desbloquean los pasos 2-4 |
| 2 | Apertura de cuenta | Link a la web de CaixaBank. Toggle OK/Pendiente |
| 3 | Firmar documento SUA | Toggle OK/Pendiente (firmado / pendiente de firma) |
| 4 | Documentación completa | Toggle OK/Pendiente. Al dar OK se simula notificación al gestor (toast de confirmación) |

### Diseño técnico

#### 1. `src/lib/bankChecklists.ts` — Nuevo archivo con checklists por banco

Mapa `BANK_CHECKLISTS` donde la key es el nombre del banco (ej: "CaixaBank") y el value es un array de items con:
- `label`, `linkUrl?`, `linkLabel?`
- `isGatekeeper?: boolean` (si es true, bloquea los siguientes hasta completarse — para "Confirmar interés")
- `notifyGestorOnComplete?: boolean` (para el paso de documentación)

Si un banco no tiene checklist específico, se usa uno genérico por defecto.

#### 2. `src/components/AdvanceModal.tsx` — Refactor completo

- Importar `BANK_CHECKLISTS` y resolver el checklist según `bankName`
- Paso 1 (Confirmar interés) actúa como "gatekeeper": hasta que no se marque OK, los demás pasos aparecen deshabilitados (opacidad reducida, no clicables)
- Cada item tiene estado OK/Pendiente con un badge visual
- Al completar el paso de documentación, mostrar toast "Notificación enviada al gestor" (simulación)
- Mantener el caso `isExternal` sin cambios

### Archivos

| Archivo | Cambio |
|---|---|
| `src/lib/bankChecklists.ts` | **Nuevo** — mapa de checklists por banco |
| `src/components/AdvanceModal.tsx` | Refactor para usar checklists dinámicos con lógica de gatekeeper y notificación |

### Nota
Me indicaste que irás listando los checklists banco por banco. CaixaBank queda implementado ahora; los demás se irán agregando al mapa cuando los definas.

