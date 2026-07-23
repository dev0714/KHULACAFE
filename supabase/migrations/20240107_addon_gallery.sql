-- Rich event add-ons: photo galleries, colour options, and a description.
-- Run once in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bjggovjpsyjoflblwiaj/editor

ALTER TABLE "Khulacafe".booking_addons
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS images jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS colors jsonb NOT NULL DEFAULT '[]'::jsonb;

-- Seed Table Cloth and Table Runners (with default colours) if missing.
INSERT INTO "Khulacafe".booking_addons (label, icon, price_cents, sort_order, colors)
SELECT 'Table Cloth', '🎀', 15000, 10, '["White","Black","Gold","Red"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM "Khulacafe".booking_addons WHERE label ILIKE 'Table Cloth');

INSERT INTO "Khulacafe".booking_addons (label, icon, price_cents, sort_order, colors)
SELECT 'Table Runners', '🎗️', 8000, 11, '["White","Black","Gold","Red"]'::jsonb
WHERE NOT EXISTS (SELECT 1 FROM "Khulacafe".booking_addons WHERE label ILIKE 'Table Runners');

-- Booking now records the specific romantic reason.
ALTER TABLE "Khulacafe".bookings ADD COLUMN IF NOT EXISTS occasion_reason text;
