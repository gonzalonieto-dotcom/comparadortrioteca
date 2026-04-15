CREATE POLICY "Anon can update interests"
  ON public.client_interests FOR UPDATE TO anon
  USING (true) WITH CHECK (true);

CREATE POLICY "Authenticated can update interests"
  ON public.client_interests FOR UPDATE TO authenticated
  USING (true) WITH CHECK (true);