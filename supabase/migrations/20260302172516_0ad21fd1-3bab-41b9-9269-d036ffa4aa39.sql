
-- 1. Add new columns to offers
ALTER TABLE public.offers
  ADD COLUMN IF NOT EXISTS estimated_tae numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_payment numeric NOT NULL DEFAULT 0;

-- 2. Fix RLS policies to be PERMISSIVE (currently RESTRICTIVE)
-- operations
DROP POLICY IF EXISTS "Gestors manage own operations" ON public.operations;
DROP POLICY IF EXISTS "Public read via share_token" ON public.operations;
CREATE POLICY "Gestors manage own operations" ON public.operations FOR ALL TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
CREATE POLICY "Public read via share_token" ON public.operations FOR SELECT USING (share_token IS NOT NULL);

-- offers
DROP POLICY IF EXISTS "Gestors manage own offers" ON public.offers;
DROP POLICY IF EXISTS "Public read offers" ON public.offers;
CREATE POLICY "Gestors manage own offers" ON public.offers FOR ALL TO authenticated USING (operation_id IN (SELECT id FROM operations WHERE created_by = auth.uid())) WITH CHECK (operation_id IN (SELECT id FROM operations WHERE created_by = auth.uid()));
CREATE POLICY "Public read offers" ON public.offers FOR SELECT USING (true);

-- offer_linkages
DROP POLICY IF EXISTS "Gestors manage own linkages" ON public.offer_linkages;
DROP POLICY IF EXISTS "Public read linkages" ON public.offer_linkages;
CREATE POLICY "Gestors manage own linkages" ON public.offer_linkages FOR ALL TO authenticated USING (offer_id IN (SELECT o.id FROM offers o JOIN operations op ON o.operation_id = op.id WHERE op.created_by = auth.uid())) WITH CHECK (offer_id IN (SELECT o.id FROM offers o JOIN operations op ON o.operation_id = op.id WHERE op.created_by = auth.uid()));
CREATE POLICY "Public read linkages" ON public.offer_linkages FOR SELECT USING (true);

-- offer_mixed_periods
DROP POLICY IF EXISTS "Gestors manage own mixed periods" ON public.offer_mixed_periods;
DROP POLICY IF EXISTS "Public read mixed periods" ON public.offer_mixed_periods;
CREATE POLICY "Gestors manage own mixed periods" ON public.offer_mixed_periods FOR ALL TO authenticated USING (offer_id IN (SELECT o.id FROM offers o JOIN operations op ON o.operation_id = op.id WHERE op.created_by = auth.uid())) WITH CHECK (offer_id IN (SELECT o.id FROM offers o JOIN operations op ON o.operation_id = op.id WHERE op.created_by = auth.uid()));
CREATE POLICY "Public read mixed periods" ON public.offer_mixed_periods FOR SELECT USING (true);
