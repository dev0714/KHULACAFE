-- Run this once in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bjggovjpsyjoflblwiaj/editor

CREATE TABLE IF NOT EXISTS "Khulacafe".email_settings (
  id int PRIMARY KEY DEFAULT 1,
  resend_api_key text,
  from_name text DEFAULT 'Khula Cafe',
  from_email text DEFAULT 'orders@khulacafe.co.za',
  reply_to text,
  notify_email text,
  notify_on_booking boolean NOT NULL DEFAULT true,
  notify_on_contact boolean NOT NULL DEFAULT true,
  imap_host text, imap_port int, imap_username text, imap_password text, imap_secure boolean DEFAULT true,
  pop_host text, pop_port int, pop_username text, pop_password text, pop_secure boolean DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_settings_singleton CHECK (id = 1)
);

INSERT INTO "Khulacafe".email_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
