CREATE POLICY "Authenticated can insert interests"
  ON public.client_interests FOR INSERT TO authenticated
  WITH CHECK (true);