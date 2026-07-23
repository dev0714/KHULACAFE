-- Gift voucher codes (fixed Rand value, single-use) + booking payment note.
-- Run once in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bjggovjpsyjoflblwiaj/editor

CREATE TABLE IF NOT EXISTS "Khulacafe".vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  amount_cents integer NOT NULL,
  active boolean NOT NULL DEFAULT true,
  expires_at date,
  redeemed_at timestamptz,
  redeemed_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Record how a booking's deposit was covered (voucher / Khula Bucks / cash).
ALTER TABLE "Khulacafe".bookings ADD COLUMN IF NOT EXISTS payment_note text;
