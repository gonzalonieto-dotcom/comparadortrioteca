
CREATE TABLE public.client_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id uuid NOT NULL,
  bank_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(operation_id, bank_name)
);
ALTER TABLE public.client_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anon can insert interests"
  ON public.client_interests FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Gestors read own interests"
  ON public.client_interests FOR SELECT TO authenticated
  USING (operation_id IN (
    SELECT id FROM operations WHERE created_by = auth.uid()
  ));
