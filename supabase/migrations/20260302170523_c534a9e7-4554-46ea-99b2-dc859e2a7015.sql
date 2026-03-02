
-- =============================================
-- Fix: Recreate all RLS policies as PERMISSIVE
-- =============================================

-- OPERATIONS
DROP POLICY IF EXISTS "Public read via share_token" ON public.operations;
DROP POLICY IF EXISTS "Users can manage own operations" ON public.operations;

CREATE POLICY "Public read via share_token" ON public.operations
  FOR SELECT USING (share_token IS NOT NULL);

CREATE POLICY "Gestors manage own operations" ON public.operations
  FOR ALL TO authenticated
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

-- OFFERS
DROP POLICY IF EXISTS "Public read offers via operation" ON public.offers;
DROP POLICY IF EXISTS "Users can manage offers of own operations" ON public.offers;

CREATE POLICY "Public read offers" ON public.offers
  FOR SELECT USING (true);

CREATE POLICY "Gestors manage own offers" ON public.offers
  FOR ALL TO authenticated
  USING (operation_id IN (SELECT id FROM public.operations WHERE created_by = auth.uid()))
  WITH CHECK (operation_id IN (SELECT id FROM public.operations WHERE created_by = auth.uid()));

-- OFFER_LINKAGES
DROP POLICY IF EXISTS "Public read linkages" ON public.offer_linkages;
DROP POLICY IF EXISTS "Users can manage linkages of own offers" ON public.offer_linkages;

CREATE POLICY "Public read linkages" ON public.offer_linkages
  FOR SELECT USING (true);

CREATE POLICY "Gestors manage own linkages" ON public.offer_linkages
  FOR ALL TO authenticated
  USING (offer_id IN (SELECT o.id FROM public.offers o JOIN public.operations op ON o.operation_id = op.id WHERE op.created_by = auth.uid()))
  WITH CHECK (offer_id IN (SELECT o.id FROM public.offers o JOIN public.operations op ON o.operation_id = op.id WHERE op.created_by = auth.uid()));

-- OFFER_MIXED_PERIODS
DROP POLICY IF EXISTS "Public read mixed periods" ON public.offer_mixed_periods;
DROP POLICY IF EXISTS "Users can manage mixed periods of own offers" ON public.offer_mixed_periods;

CREATE POLICY "Public read mixed periods" ON public.offer_mixed_periods
  FOR SELECT USING (true);

CREATE POLICY "Gestors manage own mixed periods" ON public.offer_mixed_periods
  FOR ALL TO authenticated
  USING (offer_id IN (SELECT o.id FROM public.offers o JOIN public.operations op ON o.operation_id = op.id WHERE op.created_by = auth.uid()))
  WITH CHECK (offer_id IN (SELECT o.id FROM public.offers o JOIN public.operations op ON o.operation_id = op.id WHERE op.created_by = auth.uid()));
