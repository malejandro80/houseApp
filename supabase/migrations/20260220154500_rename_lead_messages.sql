BEGIN;
  -- Remove from publication first while it has the old name
  ALTER PUBLICATION supabase_realtime DROP TABLE lead_messages;
  
  -- Rename the table
  ALTER TABLE lead_messages RENAME TO messages;
  
  -- Add to publication with the new name
  ALTER PUBLICATION supabase_realtime ADD TABLE messages;
COMMIT;
