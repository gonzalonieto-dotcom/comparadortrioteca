CREATE TABLE public.external_offer_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id uuid NOT NULL,
  bank_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_external_offer_events_operation_id ON public.external_offer_events (operation_id);
CREATE INDEX idx_external_offer_events_created_at ON public.external_offer_events (created_at);

ALTER TABLE public.external_offer_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert external offer events"
  ON public.external_offer_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Gestors read own external offer events"
  ON public.external_offer_events FOR SELECT
  TO authenticated
  USING (
    operation_id IN (SELECT id FROM public.operations WHERE created_by = auth.uid())
    OR public.has_role(auth.uid(), 'admin'::app_role)
  );