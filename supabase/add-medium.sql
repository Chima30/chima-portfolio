-- Optional, additive, safe to run more than once. Run it in Supabase > SQL Editor.
-- Adds a "medium" field to artworks (for example "digital painting").
-- Nothing is deleted or changed. Until you run this, the site works exactly as before
-- and the Medium box in /admin will show a "not saved" message.
alter table artworks add column if not exists medium text;
