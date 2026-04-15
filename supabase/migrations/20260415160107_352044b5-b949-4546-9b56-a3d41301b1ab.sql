CREATE POLICY "Anon can select interests"
  ON public.client_interests FOR SELECT TO anon
  USING (true);