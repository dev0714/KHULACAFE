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
  send_method text NOT NULL DEFAULT 'resend',
  smtp_host text, smtp_port int, smtp_username text, smtp_password text, smtp_secure boolean DEFAULT true,
  imap_host text, imap_port int, imap_username text, imap_password text, imap_secure boolean DEFAULT true,
  pop_host text, pop_port int, pop_username text, pop_password text, pop_secure boolean DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_settings_singleton CHECK (id = 1)
);

INSERT INTO "Khulacafe".email_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- If the table already existed from an earlier version, add the SMTP columns:
ALTER TABLE "Khulacafe".email_settings
  ADD COLUMN IF NOT EXISTS send_method text NOT NULL DEFAULT 'resend',
  ADD COLUMN IF NOT EXISTS smtp_host text,
  ADD COLUMN IF NOT EXISTS smtp_port int,
  ADD COLUMN IF NOT EXISTS smtp_username text,
  ADD COLUMN IF NOT EXISTS smtp_password text,
  ADD COLUMN IF NOT EXISTS smtp_secure boolean DEFAULT true;

-- Pre-fill the khulacafe.co.za mail server details (password entered in admin):
UPDATE "Khulacafe".email_settings SET
  send_method   = 'smtp',
  smtp_host     = 'smtp.khulacafe.co.za',
  smtp_port     = 465,
  smtp_secure   = true,
  smtp_username = COALESCE(NULLIF(smtp_username, ''), 'bookings@khulacafe.co.za'),
  from_name     = COALESCE(NULLIF(from_name, ''), 'Khula Cafe'),
  from_email    = 'bookings@khulacafe.co.za',
  reply_to      = COALESCE(NULLIF(reply_to, ''), 'bookings@khulacafe.co.za'),
  notify_email  = COALESCE(NULLIF(notify_email, ''), 'bookings@khulacafe.co.za'),
  imap_host     = COALESCE(NULLIF(imap_host, ''), 'mail.khulacafe.co.za'),
  imap_port     = COALESCE(imap_port, 993),
  imap_username = COALESCE(NULLIF(imap_username, ''), 'bookings@khulacafe.co.za'),
  pop_host      = COALESCE(NULLIF(pop_host, ''), 'mail.khulacafe.co.za'),
  pop_port      = COALESCE(pop_port, 995),
  pop_username  = COALESCE(NULLIF(pop_username, ''), 'bookings@khulacafe.co.za')
WHERE id = 1;
