-- Editable payment (Paystack) configuration so the client's Paystack can be set
-- from Admin → Payments without a redeploy. Falls back to env vars when empty.
-- Run once in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bjggovjpsyjoflblwiaj/editor

CREATE TABLE IF NOT EXISTS "Khulacafe".payment_settings (
  id int PRIMARY KEY DEFAULT 1,
  provider text NOT NULL DEFAULT 'paysync',      -- 'paysync' | 'paystack_direct'
  fn_base text,                                  -- PaySync proxy base URL
  credential_id text,                            -- PaySync credential id
  credential_key text,                           -- PaySync credential key (secret)
  secret_key text,                               -- Direct Paystack secret key (secret)
  public_key text,                               -- Direct Paystack public key
  site_url text,                                 -- callback base override
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT payment_settings_singleton CHECK (id = 1)
);

INSERT INTO "Khulacafe".payment_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
