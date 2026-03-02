
-- Function to generate unique share tokens
CREATE OR REPLACE FUNCTION public.generate_share_token()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  token text;
  exists_already boolean;
BEGIN
  LOOP
    token := encode(gen_random_bytes(12), 'hex');
    SELECT EXISTS(SELECT 1 FROM public.operations WHERE share_token = token) INTO exists_already;
    EXIT WHEN NOT exists_already;
  END LOOP;
  RETURN token;
END;
$$;

-- 1. Operations table
CREATE TABLE public.operations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_price numeric NOT NULL DEFAULT 0,
  appraisal_value numeric NOT NULL DEFAULT 0,
  loan_amount numeric NOT NULL DEFAULT 0,
  term_years integer NOT NULL DEFAULT 30,
  home_insurance_annual numeric NOT NULL DEFAULT 0,
  life_insurance_annual numeric NOT NULL DEFAULT 0,
  appraisal_cost numeric NOT NULL DEFAULT 0,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token text UNIQUE DEFAULT public.generate_share_token(),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.operations ENABLE ROW LEVEL SECURITY;

-- Gestores can CRUD their own operations
CREATE POLICY "Users can manage own operations" ON public.operations
  FOR ALL TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- Anyone can read via share_token (for the public link)
CREATE POLICY "Public read via share_token" ON public.operations
  FOR SELECT TO anon, authenticated
  USING (true);

-- 2. Offers table
CREATE TABLE public.offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  operation_id uuid NOT NULL REFERENCES public.operations(id) ON DELETE CASCADE,
  bank_name text NOT NULL,
  logo_color text NOT NULL DEFAULT 'hsl(200, 70%, 50%)',
  type text NOT NULL DEFAULT 'Fijo',
  base_tin numeric NOT NULL DEFAULT 0,
  amortization_fee_pct numeric NOT NULL DEFAULT 0,
  upfront_costs numeric NOT NULL DEFAULT 0,
  monthly_account_cost numeric NOT NULL DEFAULT 0,
  euribor_rate numeric,
  advantages text[] NOT NULL DEFAULT '{}',
  considerations text[] NOT NULL DEFAULT '{}',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage offers of own operations" ON public.offers
  FOR ALL TO authenticated
  USING (operation_id IN (SELECT id FROM public.operations WHERE created_by = auth.uid()))
  WITH CHECK (operation_id IN (SELECT id FROM public.operations WHERE created_by = auth.uid()));

CREATE POLICY "Public read offers via operation" ON public.offers
  FOR SELECT TO anon, authenticated
  USING (true);

-- 3. Offer linkages table
CREATE TABLE public.offer_linkages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  label text NOT NULL,
  is_active_default boolean NOT NULL DEFAULT true,
  discount_weight_pct numeric NOT NULL DEFAULT 0,
  annual_cost numeric NOT NULL DEFAULT 0
);

ALTER TABLE public.offer_linkages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage linkages of own offers" ON public.offer_linkages
  FOR ALL TO authenticated
  USING (offer_id IN (SELECT o.id FROM public.offers o JOIN public.operations op ON o.operation_id = op.id WHERE op.created_by = auth.uid()))
  WITH CHECK (offer_id IN (SELECT o.id FROM public.offers o JOIN public.operations op ON o.operation_id = op.id WHERE op.created_by = auth.uid()));

CREATE POLICY "Public read linkages" ON public.offer_linkages
  FOR SELECT TO anon, authenticated
  USING (true);

-- 4. Offer mixed periods table
CREATE TABLE public.offer_mixed_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid NOT NULL REFERENCES public.offers(id) ON DELETE CASCADE,
  from_year integer NOT NULL,
  to_year integer NOT NULL,
  fixed_tin numeric,
  spread_over_euribor numeric
);

ALTER TABLE public.offer_mixed_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage mixed periods of own offers" ON public.offer_mixed_periods
  FOR ALL TO authenticated
  USING (offer_id IN (SELECT o.id FROM public.offers o JOIN public.operations op ON o.operation_id = op.id WHERE op.created_by = auth.uid()))
  WITH CHECK (offer_id IN (SELECT o.id FROM public.offers o JOIN public.operations op ON o.operation_id = op.id WHERE op.created_by = auth.uid()));

CREATE POLICY "Public read mixed periods" ON public.offer_mixed_periods
  FOR SELECT TO anon, authenticated
  USING (true);
