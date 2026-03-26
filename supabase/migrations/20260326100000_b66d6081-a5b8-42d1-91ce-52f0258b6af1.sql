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

CREATE POLICY "Admins manage checklists"
  ON public.bank_checklist_items FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can read checklists"
  ON public.bank_checklist_items FOR SELECT TO anon, authenticated
  USING (true);