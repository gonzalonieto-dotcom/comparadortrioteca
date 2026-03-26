

## Panel admin para configurar checklists por banco + logos en el front

### Resumen

Dos cambios principales:

1. **Nueva página admin** `/admin/checklists` donde el administrador configura los pasos del checklist por banco (CRUD dinámico, guardado en base de datos). Esto reemplaza el mapa hardcodeado en código.

2. **Logos en la comparativa del cliente** — verificar y corregir que `BankLogo` se muestre correctamente en todas las vistas cliente.

---

### 1. Base de datos: tabla `bank_checklist_items`

Nueva migración:

```sql
CREATE TABLE public.bank_checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name text NOT NULL,
  label text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_gatekeeper boolean NOT NULL DEFAULT false,
  link_url text,
  link_label text,
  notify_gestor_on_complete boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bank_checklist_items ENABLE ROW LEVEL SECURITY;

-- Solo admins pueden gestionar
CREATE POLICY "Admins manage checklists"
  ON public.bank_checklist_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Lectura pública para que el front del cliente pueda leerlos
CREATE POLICY "Public can read checklists"
  ON public.bank_checklist_items FOR SELECT TO anon, authenticated
  USING (true);
```

Se cargarán los datos actuales de CaixaBank y Abanca como seed inicial con el insert tool.

### 2. Nueva página admin: `/admin/checklists`

- Desplegable para seleccionar banco (misma lista de `BANK_PRESETS`)
- Al seleccionar un banco, muestra sus pasos en tarjetas ordenables
- Cada paso tiene: label, URL opcional, label del link, checkbox "gatekeeper", checkbox "notificar gestor"
- Botones para agregar paso, eliminar paso, reordenar
- Botón "Guardar" que persiste en `bank_checklist_items`
- Accesible solo para admins

### 3. Ruta en App.tsx

Agregar: `<Route path="/admin/checklists" element={<ChecklistManager />} />`

Agregar botón "Checklists" en el header de `Operations.tsx` (junto a "Usuarios"), visible solo para admins.

### 4. Modificar `bankChecklists.ts` y `AdvanceModal`

`getBankChecklist()` pasará a consultar la base de datos en vez del mapa hardcodeado. El `AdvanceModal` recibirá los items como prop o los cargará desde la DB.

Enfoque: en `ClientComparison.tsx` y `SharedOperation.tsx`, al cargar la operación, también se hace un fetch de `bank_checklist_items` y se pasa al `AdvanceModal` como prop.

### 5. Logos en el front del cliente

Revisar `ClientComparison.tsx` para verificar que `BankLogo` se usa con logos visibles. Si el componente `OfferTable` ya usa `BankLogo`, el problema puede ser que el favicon service no carga en el contexto del cliente. Investigaré y corregiré.

---

### Archivos

| Archivo | Cambio |
|---|---|
| Migración SQL | Crear tabla `bank_checklist_items` con RLS |
| `src/pages/admin/ChecklistManager.tsx` | **Nuevo** — UI admin para gestionar checklists |
| `src/App.tsx` | Agregar ruta `/admin/checklists` |
| `src/pages/admin/Operations.tsx` | Botón "Checklists" en header para admins |
| `src/lib/bankChecklists.ts` | Cambiar `getBankChecklist` para leer de DB |
| `src/components/AdvanceModal.tsx` | Recibir checklist items como prop |
| `src/pages/ClientComparison.tsx` | Cargar checklist items de DB, pasarlos al modal |
| `src/pages/SharedOperation.tsx` | Idem |
| `src/components/OfferTable.tsx` | Verificar/corregir logos en vista cliente |

