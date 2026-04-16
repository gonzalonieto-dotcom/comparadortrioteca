
CREATE TABLE public.cached_rates (
  key text PRIMARY KEY,
  value numeric NOT NULL,
  fetched_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.cached_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read cached rates"
ON public.cached_rates
FOR SELECT
TO anon, authenticated
USING (true);
