

## Plan: Fix PDF linkage mapping + Add text-paste extraction + AI disclaimer

### Problem Analysis

1. **Admin linkages not showing weight/cost from PDF**: The `LinkageEditor` forces exactly 3 preset labels and matches by exact string. PDF extraction may return different label names (e.g., "Nómina" vs "Domiciliación de nómina"), so extracted data gets discarded and replaced with zeros.

2. **No text-paste extraction option**: Currently only PDF upload exists. User wants a textarea to paste offer text and extract data via the same AI.

3. **No AI disclaimer on client side**: Need a fun message + green checkbox on the client `ExternalOfferForm`.

---

### Changes

#### 1. Fix admin linkage mapping from PDF (`PdfDropZone.tsx`)

Update the edge function prompt to constrain linkage labels to exactly the 3 preset names: `"Domiciliación de nómina"`, `"Seguro hogar"`, `"Seguro de vida"`.

Also update `PdfDropZone.tsx` to fuzzy-match extracted linkage labels to the nearest preset (e.g., "Nómina" → "Domiciliación de nómina", "Seguro vida" → "Seguro de vida") before passing to `onExtracted`. This ensures `LinkageEditor`'s normalization finds the data.

#### 2. Add text-paste extraction option — Admin side (`PdfDropZone.tsx`)

Expand the `PdfDropZone` component to include a toggle/tab: "PDF" | "Pegar texto". When "Pegar texto" is selected, show a textarea where the user can paste offer details. On submit, call a new edge function (or extend `parse-offer-pdf`) that sends the text (instead of a PDF) to the same AI extraction pipeline. Map the response identically.

**Edge function change** (`parse-offer-pdf/index.ts`): Accept either `pdf_base64` or `text_content` in the request body. If `text_content` is provided, send it as a plain text message instead of a file attachment.

#### 3. Add text-paste extraction option — Client side (`ExternalOfferForm.tsx`)

Add a similar "Pegar texto" option alongside the existing PDF dropzone in the client-facing form. Same edge function call, same response mapping.

#### 4. AI disclaimer + confirmation checkbox — Client side (`ExternalOfferForm.tsx`)

After PDF/text extraction succeeds, show:
- A light-hearted message: *"🤖 ¡Ojo! Verifica que los datos extraídos son correctos. Como buena IA, a veces me invento cosas con mucha convicción."*
- A green checkbox that the user must tick before "Añadir a la comparativa" becomes enabled.

#### 5. Update edge function prompt

In `parse-offer-pdf/index.ts`, update `SYSTEM_PROMPT` to:
- Constrain linkage labels to exactly: "Domiciliación de nómina", "Seguro hogar", "Seguro de vida"
- Handle text input mode (when no PDF is attached)

---

### Files to modify

| File | Change |
|------|--------|
| `supabase/functions/parse-offer-pdf/index.ts` | Accept `text_content` param; constrain linkage labels in prompt |
| `src/components/admin/PdfDropZone.tsx` | Add text-paste tab; fuzzy-match linkage labels to presets |
| `src/components/ExternalOfferForm.tsx` | Add text-paste option; add AI disclaimer + confirmation checkbox |

