
-- Fix client_interests: remove dangerous policies, scope inserts to published ops
DROP POLICY IF EXISTS "Anon can select interests" ON public.client_interests;
DROP POLICY IF EXISTS "Anon can update interests" ON public.client_interests;
DROP POLICY IF EXISTS "Authenticated can update interests" ON public.client_interests;
DROP POLICY IF EXISTS "Anon can insert interests" ON public.client_interests;
DROP POLICY IF EXISTS "Authenticated can insert interests" ON public.client_interests;

CREATE POLICY "Anyone can insert interests for published ops"
ON public.client_interests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  operation_id IN (
    SELECT id FROM public.operations
    WHERE is_published = true AND deleted_at IS NULL
  )
);

-- Same hardening for external_offer_events insert
DROP POLICY IF EXISTS "Anyone can insert external offer events" ON public.external_offer_events;
CREATE POLICY "Insert external offer events for published ops"
ON public.external_offer_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  operation_id IN (
    SELECT id FROM public.operations
    WHERE is_published = true AND deleted_at IS NULL
  )
);

-- Restrict execute on SECURITY DEFINER helper (used only as column default / internal)
REVOKE EXECUTE ON FUNCTION public.generate_share_token() FROM PUBLIC, anon, authenticated;
