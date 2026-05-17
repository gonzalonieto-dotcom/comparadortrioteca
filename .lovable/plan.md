## Problema

Dos quejas combinadas en los campos numéricos:

1. Al **crear una comparativa nueva**, el formulario muestra valores por defecto (250.000, 200.000, 30…) en lugar de venir vacíos.
2. Al **borrar** un valor queda un `0` residual. Al hacer foco no se selecciona, así que cuando el gestor empieza a escribir, los dígitos se añaden *delante* o *detrás* del 0 (terminan con cosas como "01112") y luego tiene que borrar el 0 manualmente.

## Causa

- `<input type="number">` en Chrome **no soporta `select()`** llamado sincrónicamente dentro de `onFocus`. El handler global que añadimos en `src/components/ui/input.tsx` se ejecuta pero el navegador lo ignora silenciosamente. Por eso el "0" sigue ahí cuando el usuario empieza a escribir.
- Los inputs son **controlados con valor numérico**, por lo que cuando el campo queda vacío, React lo recoge como `0` y lo vuelve a pintar como "0".
- El editor de operaciones inicializa los campos con valores de `operationDefaults` (250000, 200000, 30) al crear una nueva.

## Solución

### 1. Arreglar la selección al hacer foco (raíz del bug "0 pegado")

En `src/components/ui/input.tsx`, cambiar la estrategia: cuando `type === "number"`, hacer un *swap temporal* de tipo a `text`, llamar a `select()` y restaurar el tipo a `number`. Este patrón es el único 100% fiable en Chrome para seleccionar todo el contenido de un input numérico.

```text
onFocus:
  if (type === "number") {
    const el = e.currentTarget;
    el.type = "text";
    el.select();
    el.type = "number";
  }
  onFocus?.(e);
```

Esto resuelve el caso "tengo que posicionar el cursor a la derecha del 0".

### 2. Permitir input vacío en lugar de "0" residual

Los inputs numéricos del editor (`OperationEditor.tsx`, `OfferEditor.tsx`, `LinkageEditor.tsx`, `MixedPeriodEditor.tsx`, `ExternalOfferForm.tsx`) usan el patrón:

```text
value={op.purchase_price}
onChange={(e) => setOp({ ...op, purchase_price: +e.target.value })}
```

Lo cambiaremos a un patrón que respete el string vacío:

- `value={op.purchase_price === 0 || op.purchase_price == null ? "" : op.purchase_price}` para que **no aparezca "0" por defecto** ni después de borrar.
- En `onChange`, si el string está vacío, guardar `0` internamente (para no romper cálculos), pero la UI seguirá mostrando vacío hasta que el usuario teclee.

Combinado con el fix de selección, cuando hagas foco sobre un campo con valor 0 (o cualquier número) verás todo seleccionado y empezarás a escribir directamente sin tener que borrar nada.

### 3. Crear comparativa con campos vacíos

En `OperationEditor.tsx`, cuando la ruta es de creación (no hay `id` cargado de la base de datos), inicializar el estado con:

- `purchase_price: 0`
- `loan_amount: 0`
- `term_years: 0` (o 30 si queremos mantener un valor "razonable" para plazo; lo dejaré en 0 para coherencia con la regla "no inventar")
- seguros y tasación: 0

Como ahora los inputs muestran "" cuando el valor es 0, el formulario se verá limpio. Mantengo los defaults previos solo si el usuario explícitamente lo pide más adelante.

### Archivos a modificar

- `src/components/ui/input.tsx` — fix selección con swap de tipo.
- `src/pages/admin/OperationEditor.tsx` — inputs con value vacío cuando es 0 + defaults vacíos al crear.
- `src/components/admin/OfferEditor.tsx` — inputs con value vacío cuando es 0.
- `src/components/admin/LinkageEditor.tsx` — idem.
- `src/components/admin/MixedPeriodEditor.tsx` — idem.
- `src/components/ExternalOfferForm.tsx` — idem.

Sin migraciones ni cambios de lógica de cálculo.
