
-- 1. Add is_published column to operations
ALTER TABLE public.operations ADD COLUMN is_published boolean NOT NULL DEFAULT false;

-- 2. Drop ALL existing RESTRICTIVE RLS policies
DROP POLICY IF EXISTS "Gestors manage own operations" ON public.operations;
DROP POLICY IF EXISTS "Public read via share_token" ON public.operations;
DROP POLICY IF EXISTS "Gestors manage own offers" ON public.offers;
DROP POLICY IF EXISTS "Public read offers" ON public.offers;
DROP POLICY IF EXISTS "Gestors manage own linkages" ON public.offer_linkages;
DROP POLICY IF EXISTS "Public read linkages" ON public.offer_linkages;
DROP POLICY IF EXISTS "Gestors manage own mixed periods" ON public.offer_mixed_periods;
DROP POLICY IF EXISTS "Public read mixed periods" ON public.offer_mixed_periods;

-- 3. Recreate as PERMISSIVE
-- operations: gestor owns
CREATE POLICY "Gestors manage own operations"
ON public.operations FOR ALL TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- operations: public read via share_token
CREATE POLICY "Public read via share_token"
ON public.operations FOR SELECT TO anon, authenticated
USING (share_token IS NOT NULL);

-- offers: gestor owns via subquery
CREATE POLICY "Gestors manage own offers"
ON public.offers FOR ALL TO authenticated
USING (operation_id IN (SELECT id FROM public.operations WHERE created_by = auth.uid()))
WITH CHECK (operation_id IN (SELECT id FROM public.operations WHERE created_by = auth.uid()));

-- offers: public read
CREATE POLICY "Public read offers"
ON public.offers FOR SELECT TO anon, authenticated
USING (true);

-- offer_linkages: gestor owns
CREATE POLICY "Gestors manage own linkages"
ON public.offer_linkages FOR ALL TO authenticated
USING (offer_id IN (SELECT o.id FROM offers o JOIN operations op ON o.operation_id = op.id WHERE op.created_by = auth.uid()))
WITH CHECK (offer_id IN (SELECT o.id FROM offers o JOIN operations op ON o.operation_id = op.id WHERE op.created_by = auth.uid()));

-- offer_linkages: public read
CREATE POLICY "Public read linkages"
ON public.offer_linkages FOR SELECT TO anon, authenticated
USING (true);

-- offer_mixed_periods: gestor owns
CREATE POLICY "Gestors manage own mixed periods"
ON public.offer_mixed_periods FOR ALL TO authenticated
USING (offer_id IN (SELECT o.id FROM offers o JOIN operations op ON o.operation_id = op.id WHERE op.created_by = auth.uid()))
WITH CHECK (offer_id IN (SELECT o.id FROM offers o JOIN operations op ON o.operation_id = op.id WHERE op.created_by = auth.uid()));

-- offer_mixed_periods: public read
CREATE POLICY "Public read mixed periods"
ON public.offer_mixed_periods FOR SELECT TO anon, authenticated
USING (true);
