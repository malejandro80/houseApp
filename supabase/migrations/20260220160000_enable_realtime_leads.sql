BEGIN;
  -- Add the leads table to the realtime publication so the Kanban boards update magically
  ALTER PUBLICATION supabase_realtime ADD TABLE leads;
COMMIT;
