-- Run this once in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bjggovjpsyjoflblwiaj/editor

-- 1. Add the category column so occasions can be grouped
--    (Romantic / Business / Special Occasion)
ALTER TABLE "Khulacafe".booking_occasions
  ADD COLUMN IF NOT EXISTS category text NOT NULL DEFAULT 'Special Occasion';

-- 2. Let occasions be deleted/replaced even when past bookings reference them
--    (the booking keeps its record; the occasion link just becomes empty)
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT conname FROM pg_constraint
    WHERE conrelid = '"Khulacafe".bookings'::regclass
      AND confrelid = '"Khulacafe".booking_occasions'::regclass
  LOOP
    EXECUTE format('ALTER TABLE "Khulacafe".bookings DROP CONSTRAINT %I', r.conname);
  END LOOP;

  ALTER TABLE "Khulacafe".bookings
    ADD CONSTRAINT bookings_occasion_id_fkey
    FOREIGN KEY (occasion_id)
    REFERENCES "Khulacafe".booking_occasions(id)
    ON DELETE SET NULL;
END $$;
