

# Extracción automática de datos de oferta bancaria desde PDF

## Resumen
Añadir una zona de drag-and-drop en el editor de ofertas donde el gestor pueda soltar un PDF de oferta bancaria. Un modelo de IA extraerá los campos relevantes (banco, tipo, TIN, bonificaciones, comisiones, etc.) y pre-rellenará el formulario. El gestor revisa y confirma.

## Arquitectura

```text
┌─────────────────────┐     ┌──────────────────────┐     ┌─────────────┐
│  OfferEditor UI     │     │  Edge Function        │     │  Lovable AI │
│  (drag & drop PDF)  │────▶│  parse-offer-pdf      │────▶│  Gemini 2.5 │
│                     │◀────│  (base64 → AI → JSON) │◀────│  Flash      │
└─────────────────────┘     └──────────────────────┘     └─────────────┘
```

## Cambios

### 1. Nueva edge function: `supabase/functions/parse-offer-pdf/index.ts`
- Recibe el PDF como base64 en el body
- Envía al modelo `google/gemini-2.5-flash` (soporta PDFs/imágenes) via Lovable AI gateway
- Prompt estructurado que pide extraer: `bank_name`, `type` (Fijo/Mixto/Variable), `base_tin`, `bonificaciones` (array con label, peso%, coste anual), `amortization_fee_pct`, `upfront_costs`, `monthly_account_cost`, `euribor_rate`, `advantages`
- Devuelve JSON tipado que mapea directamente a `OfferFormData`

### 2. Componente `src/components/admin/PdfDropZone.tsx`
- Zona de drag-and-drop con estados: idle, dragging, processing, done/error
- Acepta archivos `.pdf` (max ~10MB)
- Convierte a base64 y llama a la edge function
- Callback `onExtracted(data: Partial<OfferFormData>)` para rellenar el formulario

### 3. Modificar `src/components/admin/OfferEditor.tsx`
- Añadir `PdfDropZone` dentro de la card expandida, arriba del formulario (solo si los campos están vacíos o siempre visible como opción)
- Al recibir datos extraídos, hacer merge con el estado actual del formulario
- Mostrar toast de confirmación "Datos extraídos del PDF — revisa y ajusta"

### 4. Config: `supabase/config.toml`
- Añadir `[functions.parse-offer-pdf]` con `verify_jwt = false`

## Detalle del prompt de extracción

El prompt pedirá al modelo que analice el PDF y devuelva un JSON estricto con los campos de la oferta. Incluirá los nombres de bancos conocidos (`BANK_PRESETS`) y los tipos de bonificación esperados para mejorar la precisión del mapeo.

## UX
- La dropzone aparece como un recuadro punteado con icono de PDF dentro de cada card de oferta expandida
- Mientras procesa: spinner + "Extrayendo datos del PDF..."
- Al completar: los campos se rellenan automáticamente y se muestra un toast
- El gestor puede editar cualquier campo después de la extracción

