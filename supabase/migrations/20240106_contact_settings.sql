-- Editable "Find Us" content (address, phone, email, WhatsApp, trading hours,
-- socials) for the public Contact page, managed from Admin → Find Us.
-- Run once in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bjggovjpsyjoflblwiaj/editor

CREATE TABLE IF NOT EXISTS "Khulacafe".contact_settings (
  id int PRIMARY KEY DEFAULT 1,
  address text,
  phone text,
  email text,
  whatsapp text,
  trading_hours jsonb NOT NULL DEFAULT '[]'::jsonb,
  instagram text,
  tiktok text,
  facebook text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT contact_settings_singleton CHECK (id = 1)
);

INSERT INTO "Khulacafe".contact_settings (id, address, phone, email, whatsapp, trading_hours, instagram, tiktok, facebook)
VALUES (
  1,
  'Dickswell Centre, Cnr Old Main Road, Unit DC2, St Johns Ave, Pinetown, Durban, 3610',
  '061 489 4615',
  'bookings@khulacafe.co.za',
  '27614894615',
  '[{"day":"Monday – Thursday","hours":"08:00 – 21:00"},{"day":"Friday – Saturday","hours":"08:00 – 23:00"},{"day":"Sunday","hours":"09:00 – 20:00"},{"day":"Public Holidays","hours":"09:00 – 18:00"}]'::jsonb,
  'khulacafe', 'khulacafe', 'khulacafe'
)
ON CONFLICT (id) DO NOTHING;
