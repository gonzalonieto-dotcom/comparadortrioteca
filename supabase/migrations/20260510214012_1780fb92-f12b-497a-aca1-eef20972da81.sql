ALTER TABLE public.operations ADD COLUMN deleted_at timestamptz NULL;
CREATE INDEX IF NOT EXISTS idx_operations_deleted_at ON public.operations (deleted_at);