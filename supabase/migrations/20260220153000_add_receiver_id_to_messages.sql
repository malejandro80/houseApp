ALTER TABLE lead_messages ADD COLUMN receiver_id UUID REFERENCES auth.users(id);

CREATE OR REPLACE FUNCTION set_receiver_id_function()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.receiver_id IS NULL THEN
     SELECT CASE 
         WHEN advisor_id = NEW.sender_id THEN created_by 
         ELSE advisor_id 
     END INTO NEW.receiver_id
     FROM leads WHERE id = NEW.lead_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_set_receiver_id
BEFORE INSERT ON lead_messages
FOR EACH ROW
EXECUTE FUNCTION set_receiver_id_function();

