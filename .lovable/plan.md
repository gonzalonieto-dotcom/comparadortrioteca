Voy a corregir el problema desde la raíz: no basta con seleccionar el contenido al hacer foco; el fallo ocurre porque muchos campos guardan `+e.target.value`, y cuando el input queda vacío eso se convierte automáticamente en `0`.

Plan:

1. Crear un manejo común para inputs numéricos
   - Añadir una variante reutilizable en `src/components/ui/input.tsx` que soporte inputs numéricos controlados sin convertir el vacío en `0` visualmente.
   - Mantener el comportamiento de seleccionar todo al hacer foco.
   - Al pulsar Delete/Backspace y dejar el campo vacío, el campo debe quedarse vacío en pantalla.

2. Corregir campos de la comparativa del gestor
   - Actualizar los campos de `src/pages/admin/OperationEditor.tsx` para mostrar vacío cuando el valor interno sea `0` en campos que parten de cero.
   - Al escribir un número, se guardará el número correctamente para cálculos y guardado.
   - Al borrar el campo completo, no reaparecerá el `0` en el input.

3. Corregir campos de ofertas y bonificaciones
   - Actualizar `src/components/admin/OfferEditor.tsx`, `src/components/admin/LinkageEditor.tsx` y `src/components/admin/MixedPeriodEditor.tsx` donde hoy se usa `+e.target.value`.
   - Evitar que comisiones, gastos, TIN, costes, años y bonificaciones vuelvan a mostrar `0` mientras el gestor está editando.

4. Corregir el front de cliente para oferta externa
   - Actualizar `src/components/ExternalOfferForm.tsx` para que campos con valor inicial `0`, como comisión o bonificaciones añadidas, también puedan borrarse y reescribirse sin dejar un cero pegado.

Detalle técnico:
- El bug viene de `+"" === 0`. Cuando el usuario borra el contenido, React recibe `0` y lo vuelve a pintar.
- La solución será separar el valor visual del valor numérico: `""` mientras el usuario deja el campo vacío, y número real cuando escribe contenido.
- No cambiaré lógica financiera ni base de datos; solo el comportamiento de edición de inputs.