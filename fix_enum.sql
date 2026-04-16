BEGIN;
-- Convert column to text temporarily
ALTER TABLE feeds ALTER COLUMN feed_type TYPE text;
-- Update values to lowercase
UPDATE feeds SET feed_type = lower(feed_type);
-- TELEGRAM -> api
UPDATE feeds SET feed_type = 'website' WHERE feed_type = 'telegram';
-- Drop old enum and create new one
DROP TYPE feedtype;
CREATE TYPE feedtype AS ENUM ('website', 'onion', 'rss', 'api');
-- Convert column back to enum
ALTER TABLE feeds ALTER COLUMN feed_type TYPE feedtype USING feed_type::feedtype;
COMMIT;
