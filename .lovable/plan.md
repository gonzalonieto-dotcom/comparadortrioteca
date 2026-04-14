

## Plan: Notificación al gestor cuando el cliente confirma interés

### Situación actual
Cuando el cliente pulsa "Confirmar interés" (gatekeeper) en el modal de avance, solo se muestra un toast local. No se envía ninguna notificación real al gestor. Además, el proyecto no tiene infraestructura de email configurada (no hay dominio de envío).

### Enfoque propuesto

Crear una edge function `notify-gestor-interest` que se invoque desde el cliente cuando marca el gatekeeper. La función:
1. Recibe `operationId` + `bankName` + `clientName`
2. Busca el `created_by` de la operación para obtener el email del gestor
3. Envía un email de notificación al gestor

### Requisito previo: configurar dominio de email
Para poder enviar emails desde la aplicación, necesitas configurar un dominio de envío (ej: `notify@tudominio.com`). Es un paso que se hace una sola vez desde la configuración del proyecto.

### Cambios técnicos

**1. Configurar infraestructura de email**
- Configurar dominio de email (requiere tu intervención para agregar registros DNS)
- Crear la infraestructura de envío y la plantilla de notificación

**2. Nueva edge function: `notify-gestor-interest`**
- Recibe `{ operationId, bankName, clientName }` (sin autenticación, ya que la llama el cliente público)
- Valida el input con Zod
- Consulta `operations` para obtener `created_by` y `client_name`
- Consulta `auth.users` (con service role) para obtener el email del gestor
- Envía email con asunto: "🔔 {clientName} ha confirmado interés en {bankName}"
- Incluye protección de idempotencia para evitar envíos duplicados

**3. Modificar `AdvanceModal.tsx`**
- Recibir `operationId` y `clientName` como props adicionales
- Cuando se marca el gatekeeper, invocar la edge function
- Mantener el toast actual como feedback inmediato

**4. Modificar `ClientComparison.tsx`**
- Pasar `operationId` y `clientName` (disponibles desde la respuesta de `get-comparison`) al `AdvanceModal`

**5. Actualizar `get-comparison` edge function**
- Incluir `created_by` y `client_name` en la respuesta (ya los devuelve como parte de `operation`)

