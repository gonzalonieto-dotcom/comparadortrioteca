

## Plan: Notificación in-app al gestor cuando el cliente confirma interés

### Enfoque
En lugar de enviar un email, guardar en la base de datos qué banco le interesó al cliente. El gestor verá un tag/badge directamente en su listado de operaciones indicando "Cliente interesado en X banco".

### Cambios técnicos

**1. Nueva tabla `client_interests` (migración SQL)**
```sql
CREATE TABLE public.client_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id uuid NOT NULL,
  bank_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(operation_id, bank_name)
);
ALTER TABLE public.client_interests ENABLE ROW LEVEL SECURITY;

-- Anon puede insertar (el cliente público)
CREATE POLICY "Anon can insert interests"
  ON public.client_interests FOR INSERT TO anon
  WITH CHECK (true);

-- Gestores autenticados leen los de sus operaciones
CREATE POLICY "Gestors read own interests"
  ON public.client_interests FOR SELECT TO authenticated
  USING (operation_id IN (
    SELECT id FROM operations WHERE created_by = auth.uid()
  ));
```

**2. Modificar `AdvanceModal.tsx`**
- Reemplazar la llamada a la edge function `notify-gestor-interest` por un INSERT directo a `client_interests` usando el cliente Supabase (con la clave anon, ya que la política permite inserts anónimos).
- Eliminar la referencia a la edge function.

**3. Modificar `src/pages/admin/Operations.tsx`**
- Al cargar operaciones, consultar también `client_interests` para las operaciones del gestor.
- Mostrar un `<Badge>` adicional en la fila de cada operación: "🟢 Interesado en {bankName}" por cada registro encontrado.

**4. Limpiar edge function**
- Eliminar `supabase/functions/notify-gestor-interest/index.ts` (ya no se necesita).

