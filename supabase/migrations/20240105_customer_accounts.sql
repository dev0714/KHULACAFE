-- Customer login/registration: reuse the existing customers table (so accounts
-- are tied to Khula Bucks loyalty) by adding a password hash.
-- Run once in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bjggovjpsyjoflblwiaj/editor

ALTER TABLE "Khulacafe".customers ADD COLUMN IF NOT EXISTS password_hash text;

-- Registered accounts must have a unique email (case-insensitive). Admin-added
-- loyalty customers without a password are not constrained.
CREATE UNIQUE INDEX IF NOT EXISTS customers_email_lower_unique
  ON "Khulacafe".customers (lower(email))
  WHERE password_hash IS NOT NULL;
