
CREATE OR REPLACE FUNCTION public.generate_share_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
