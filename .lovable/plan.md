

## Agregar checklist de Abanca

Misma lógica que CaixaBank: "Confirmar interés" como gatekeeper, y el último paso notifica al gestor.

### Checklist Abanca

| # | Paso | Comportamiento |
|---|---|---|
| 1 | Confirmar interés del cliente | Gatekeeper — desbloquea los siguientes |
| 2 | Apertura de cuenta | Link a `https://www.abanca.com/es/cuentas/` |
| 3 | Documentación actualizada, completa y enviada al banco | Notifica al gestor al completar |

### Cambio

**`src/lib/bankChecklists.ts`** — Agregar entrada `Abanca` al mapa `BANK_CHECKLISTS`:

```ts
Abanca: [
  { label: "Confirmar interés del cliente", isGatekeeper: true },
  { label: "Apertura de cuenta", linkUrl: "https://www.abanca.com/es/cuentas/", linkLabel: "Abrir cuenta en Abanca" },
  { label: "Documentación actualizada, completa y enviada al banco", notifyGestorOnComplete: true },
],
```

Un solo archivo modificado. El modal ya resuelve el checklist dinámicamente por nombre de banco.

