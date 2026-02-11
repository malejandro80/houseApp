-- Migration to increase the size of price columns to accommodate larger values (e.g., highly inflated currencies or luxury properties).
-- Changing from INTEGER (presumably) to BIGINT (8 bytes).

ALTER TABLE datahouse
ALTER COLUMN sale_price TYPE BIGINT,
ALTER COLUMN rent_price TYPE BIGINT;
