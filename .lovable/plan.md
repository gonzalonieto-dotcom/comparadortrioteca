

## Corrección del checklist de Abanca y lógica del gatekeeper

### Bugs identificados

1. **Checklist no se resetea al cambiar de banco si tienen la misma cantidad de ítems**: El `useEffect` que resetea `statuses` depende de `checklist.length`. Abanca y el DEFAULT ambos tienen 3 ítems, así que al cambiar entre ellos el efecto no se re-ejecuta y queda con el estado anterior (posiblemente todo desbloqueado).

2. **`checklist` se recalcula en cada render**: Como `getBankChecklist()` devuelve un array nuevo cada vez, no se puede usar como dependencia estable del efecto. Hay que memoizarlo o usar `bankName` directamente como dependencia.

### Solución

#### `src/components/AdvanceModal.tsx`

- Cambiar la dependencia del `useEffect` de `checklist.length` a `bankName` directamente, para que siempre se reseteen los estados al abrir el modal o cambiar de banco:

```ts
useEffect(() => {
  if (open) {
    setStatuses(new Array(checklist.length).fill(false));
  }
}, [open, bankName]); // ← bankName en vez de checklist.length
```

Esto garantiza que:
- Abanca muestra sus 3 pasos específicos (no los de CaixaBank)
- Al abrir el modal, todos los pasos arrancan en "Pendiente"
- El gatekeeper ("Confirmar interés") bloquea los pasos siguientes hasta marcarse OK

### Archivos a modificar

| Archivo | Cambio |
|---|---|
| `src/components/AdvanceModal.tsx` | Corregir dependencia del `useEffect` para usar `bankName` |

