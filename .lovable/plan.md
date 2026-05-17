## Problema

El extractor de ofertas (`parse-offer-pdf`) rellena campos con `0` o valores genéricos cuando no encuentra el dato en el PDF/texto, lo que provoca que el gestor cargue datos inventados (TIN 0, comisiones 0, costes 0, vinculaciones con peso fantasma, etc.). El usuario quiere precisión: **si no está, no inventar**.

Hoy esto ocurre por tres motivos:

1. El **system prompt** no prohíbe explícitamente inventar y da defaults ("Si no se menciona, pon 0").
2. El **tool schema** define los campos numéricos como obligatorios o sin permitir `null`, así que el modelo se ve forzado a inventar un número.
3. En el cliente (`PdfDropZone.mapExtracted`), si el modelo no devuelve un campo se sustituye por `0` con `?? 0`, perdiendo la distinción entre "no encontrado" y "es cero".

## Solución

### 1. Reescribir el system prompt (`supabase/functions/parse-offer-pdf/index.ts`)

- Regla #1: **prohibido inventar**. Si un dato no aparece de forma inequívoca en el documento, omitir el campo (no enviarlo) en vez de poner 0.
- Eliminar la instrucción actual de "si no se menciona, pon 0".
- Aclarar que `0` solo debe usarse cuando el documento dice expresamente "0 €" / "sin comisión" / "sin coste".
- Añadir reglas anti-alucinación: no rellenar `advantages` si no hay un texto literal en el documento; no agregar `linkages` si no aparecen explícitas; no inferir `euribor_rate` si el documento no lo dice.
- Aclarar cómo derivar `discount_weight_pct` solo cuando el documento muestra TIN base y TIN bonificado (o pesos explícitos); si no, dejar la vinculación con `discount_weight_pct` omitido (no inventado).

### 2. Ajustar el tool schema

- Quitar todos los `required` salvo `bank_name` y `type` (lo mínimo identificable). `base_tin` deja de ser obligatorio: mejor omitido que inventado.
- En `linkages.items`, solo `label` queda como requerido; `discount_weight_pct` y `annual_cost` opcionales.
- Mantener `additionalProperties: false`.

### 3. Subir la calidad del modelo

- Cambiar de `google/gemini-2.5-flash` a `google/gemini-2.5-pro` para extracción (mejor razonamiento sobre documentos densos). Mantener el resto de la llamada igual.

### 4. Mapeo en el cliente (`src/components/admin/PdfDropZone.tsx`)

- Cambiar `mapExtracted` para **no sobrescribir** con `0` los campos no devueltos por el modelo. Solo se incluyen en el `patch` las propiedades que el extractor devolvió. Así, los inputs del editor mantienen su valor actual (o quedan vacíos a la espera del gestor) en lugar de "0 forzado".
- Igual para `linkages`: si no hay `discount_weight_pct` o `annual_cost` devueltos, dejarlos en `0` solo si el modelo no aportó nada, **pero** marcando visualmente con un placeholder o simplemente dejando 0 (mismo comportamiento UI). Para no inventar, conservar la regla actual de no añadir vinculaciones que el modelo no haya enviado.
- Retornar también una lista `missing_fields` (derivada en el frontend) y mostrar un aviso compacto debajo del dropzone: "Revisa estos campos, no se encontraron en el documento: TIN, comisión, …". Esto guía al gestor a no firmar a ciegas.

### 5. (Opcional, mismo cambio) Exponer la lista de campos faltantes desde el backend

- Añadir al schema un campo `missing_fields: string[]` que el modelo debe rellenar con los nombres de los campos que no encontró. Es redundante con la omisión, pero ayuda a que el gestor lo vea explícito.

### Archivos a modificar

- `supabase/functions/parse-offer-pdf/index.ts` (prompt + schema + modelo)
- `src/components/admin/PdfDropZone.tsx` (mapeo sin defaults + aviso de campos faltantes)

Sin migraciones ni cambios en otras superficies.
