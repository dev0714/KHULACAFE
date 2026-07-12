'use client'
import { useState, useTransition } from 'react'
import { saveEmailSettings, sendTestEmailAdmin } from '../actions'

const CREATE_SQL = `CREATE TABLE IF NOT EXISTS "Khulacafe".email_settings (
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
INSERT INTO "Khulacafe".email_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;`

const UPGRADE_SQL = `ALTER TABLE "Khulacafe".email_settings
  ADD COLUMN IF NOT EXISTS send_method text NOT NULL DEFAULT 'resend',
  ADD COLUMN IF NOT EXISTS smtp_host text,
  ADD COLUMN IF NOT EXISTS smtp_port int,
  ADD COLUMN IF NOT EXISTS smtp_username text,
  ADD COLUMN IF NOT EXISTS smtp_password text,
  ADD COLUMN IF NOT EXISTS smtp_secure boolean DEFAULT true;`

const inp = { width: '100%', padding: '10px 14px', background: '#0a0600', border: '1px solid #2e2000', borderRadius: '8px', color: '#fafafa', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }
const lbl = { display: 'block', fontSize: '10px', letterSpacing: '2px', color: '#f5c842', marginBottom: '6px', textTransform: 'uppercase' }
const btnP = { padding: '11px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #f5c842, #c8940c)', color: '#0a0600', fontWeight: 700, fontSize: '13px' }
const btnG = { padding: '11px 22px', borderRadius: '8px', border: '1px solid #2e2000', cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }
const card = { background: '#1e1500', border: '1px solid #2e2000', borderRadius: '14px', padding: '24px', marginBottom: '20px' }
const sectionTitle = { color: '#fafafa', fontSize: '16px', fontFamily: 'var(--font-playfair)', marginBottom: '4px' }
const sectionSub = { color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '20px', lineHeight: 1.6 }

function Field({ label, children }) {
  return <div><label style={lbl}>{label}</label>{children}</div>
}

function SqlCard({ title, sql }) {
  const [copied, setCopied] = useState(false)
  function copy() { navigator.clipboard.writeText(sql); setCopied(true); setTimeout(() => setCopied(false), 2000) }
  return (
    <div style={{ ...card, border: '1px solid #c8940c' }}>
      <div style={{ fontSize: '22px', marginBottom: '10px' }}>⚠️</div>
      <h2 style={{ color: '#f5c842', fontSize: '15px', marginBottom: '8px' }}>{title}</h2>
      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '16px', lineHeight: 1.7 }}>
        Run this once in your <a href="https://supabase.com/dashboard/project/bjggovjpsyjoflblwiaj/editor" target="_blank" style={{ color: '#f5c842' }}>Supabase SQL Editor</a>, then refresh this page.
      </p>
      <pre style={{ background: '#0a0600', border: '1px solid #2e2000', borderRadius: '8px', padding: '14px', fontSize: '11px', color: '#fafafa', whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: '12px' }}>{sql}</pre>
      <button onClick={copy} style={{ ...btnP, background: copied ? '#166534' : btnP.background, color: copied ? '#fff' : '#0a0600' }}>
        {copied ? '✓ Copied!' : 'Copy SQL'}
      </button>
    </div>
  )
}

export default function SettingsClient({ initial, tableMissing, needsSmtpColumns }) {
  const [form, setForm] = useState(() => ({
    send_method: initial?.send_method ?? 'smtp',
    from_name: initial?.from_name || 'Khula Cafe',
    from_email: initial?.from_email || 'bookings@khulacafe.co.za',
    reply_to: initial?.reply_to || 'bookings@khulacafe.co.za',
    resend_api_key: '',
    // SMTP — defaults to the khulacafe.co.za mail server details
    smtp_host: initial?.smtp_host || 'smtp.khulacafe.co.za',
    smtp_port: initial?.smtp_port ?? 465,
    smtp_username: initial?.smtp_username || 'bookings@khulacafe.co.za',
    smtp_password: '',
    smtp_secure: initial?.smtp_secure ?? true,
    // Notifications
    notify_email: initial?.notify_email || 'bookings@khulacafe.co.za',
    notify_on_booking: initial?.notify_on_booking ?? true,
    notify_on_contact: initial?.notify_on_contact ?? true,
    // IMAP
    imap_host: initial?.imap_host || 'mail.khulacafe.co.za',
    imap_port: initial?.imap_port ?? 993,
    imap_username: initial?.imap_username || 'bookings@khulacafe.co.za',
    imap_password: '',
    imap_secure: initial?.imap_secure ?? true,
    // POP
    pop_host: initial?.pop_host || 'mail.khulacafe.co.za',
    pop_port: initial?.pop_port ?? 995,
    pop_username: initial?.pop_username || 'bookings@khulacafe.co.za',
    pop_password: '',
    pop_secure: initial?.pop_secure ?? true,
  }))
  const [saved, setSaved] = useState(false)
  const [testTo, setTestTo] = useState('')
  const [testResult, setTestResult] = useState(null)
  const [isPending, startTransition] = useTransition()
  const [isTesting, startTest] = useTransition()

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setSaved(false) }
  const isSmtp = form.send_method === 'smtp'

  function save() {
    startTransition(async () => {
      const payload = { ...form }
      for (const k of ['smtp_port', 'imap_port', 'pop_port']) {
        payload[k] = payload[k] === '' || payload[k] == null ? null : Number(payload[k])
      }
      const result = await saveEmailSettings(payload)
      if (result?.error) { alert(`Could not save:\n${result.error}`); return }
      if (result?.warning) alert(result.warning)
      setSaved(true)
      setForm(f => ({ ...f, resend_api_key: '', smtp_password: '', imap_password: '', pop_password: '' }))
    })
  }

  function runTest() {
    setTestResult(null)
    startTest(async () => { setTestResult(await sendTestEmailAdmin(testTo)) })
  }

  if (tableMissing) return (
    <div style={{ maxWidth: '680px' }}>
      <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '28px', color: '#fafafa', marginBottom: '8px' }}>Email Settings</h1>
      <SqlCard title="One-time database setup required" sql={CREATE_SQL} />
    </div>
  )

  return (
    <div style={{ maxWidth: '680px' }}>
      <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '28px', color: '#fafafa', marginBottom: '6px' }}>Email Settings</h1>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '28px', lineHeight: 1.6 }}>
        Configure how Khula Cafe sends booking, order, and contact-form emails. Changes take effect immediately — no redeploy needed.
      </p>

      {needsSmtpColumns && <SqlCard title="Enable SMTP — one-time database update" sql={UPGRADE_SQL} />}

      {/* ── Sending method ── */}
      <div style={card}>
        <h2 style={sectionTitle}>Sending Method</h2>
        <p style={sectionSub}>Choose how outgoing emails are sent.</p>
        <div style={{ display: 'grid', gap: '10px' }}>
          {[
            { v: 'smtp', title: 'Your mail server (SMTP)', desc: 'Send from your real mailbox, e.g. bookings@khulacafe.co.za. Recommended.' },
            { v: 'resend', title: 'Resend', desc: 'Send via the Resend API (requires a verified domain).' },
          ].map(o => (
            <label key={o.v} style={{
              display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '14px', borderRadius: '10px', cursor: 'pointer',
              background: form.send_method === o.v ? 'rgba(200,148,12,0.12)' : '#0a0600',
              border: `1px solid ${form.send_method === o.v ? '#c8940c' : '#2e2000'}`,
            }}>
              <input type="radio" name="send_method" checked={form.send_method === o.v} onChange={() => set('send_method', o.v)} style={{ marginTop: '2px' }} />
              <div>
                <div style={{ color: '#fafafa', fontSize: '13px', fontWeight: 600 }}>{o.title}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '2px' }}>{o.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* ── Sender identity ── */}
      <div style={card}>
        <h2 style={sectionTitle}>Sender</h2>
        <p style={sectionSub}>
          {isSmtp
            ? 'For SMTP, the From email should match your SMTP username (the account you authenticate as).'
            : 'The domain of the From email must be verified in Resend.'}
        </p>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="From Name"><input style={inp} value={form.from_name} onChange={e => set('from_name', e.target.value)} placeholder="Khula Cafe" /></Field>
            <Field label="From Email"><input style={inp} value={form.from_email} onChange={e => set('from_email', e.target.value)} placeholder="bookings@khulacafe.co.za" /></Field>
          </div>
          <Field label="Reply-To (optional)"><input style={inp} value={form.reply_to} onChange={e => set('reply_to', e.target.value)} placeholder="bookings@khulacafe.co.za" /></Field>
        </div>
      </div>

      {/* ── SMTP ── */}
      <div style={{ ...card, opacity: isSmtp ? 1 : 0.55 }}>
        <h2 style={sectionTitle}>Outgoing Mail — SMTP</h2>
        <p style={sectionSub}>Your mail server's sending credentials. Used when the sending method above is set to SMTP.</p>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
            <Field label="SMTP Host"><input style={inp} value={form.smtp_host} onChange={e => set('smtp_host', e.target.value)} placeholder="smtp.khulacafe.co.za" /></Field>
            <Field label="Port"><input style={inp} type="number" value={form.smtp_port} onChange={e => set('smtp_port', e.target.value)} placeholder="465" /></Field>
          </div>
          <Field label="Username"><input style={inp} value={form.smtp_username} onChange={e => set('smtp_username', e.target.value)} placeholder="bookings@khulacafe.co.za" /></Field>
          <Field label="Password">
            <input type="password" autoComplete="off" style={inp}
              placeholder={initial?.has_smtp_password ? 'Set — leave blank to keep' : 'Your mailbox password'}
              value={form.smtp_password} onChange={e => set('smtp_password', e.target.value)} />
          </Field>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.7)', fontSize: '13px', cursor: 'pointer' }}>
            <input type="checkbox" checked={!!form.smtp_secure} onChange={e => set('smtp_secure', e.target.checked)} /> Use SSL/TLS (port 465)
          </label>
        </div>
      </div>

      {/* ── Resend ── */}
      <div style={{ ...card, opacity: isSmtp ? 0.55 : 1 }}>
        <h2 style={sectionTitle}>Resend API</h2>
        <p style={sectionSub}>Used when the sending method is set to Resend.</p>
        <Field label="Resend API Key">
          <input type="password" autoComplete="off" style={inp}
            placeholder={initial?.has_resend_api_key ? `Set — ${initial.resend_api_key_preview} (leave blank to keep)` : 're_xxxxxxxxxxxxxxxx'}
            value={form.resend_api_key} onChange={e => set('resend_api_key', e.target.value)} />
        </Field>
      </div>

      {/* ── Staff notifications ── */}
      <div style={card}>
        <h2 style={sectionTitle}>Staff Notifications</h2>
        <p style={sectionSub}>Get an email to your team whenever a new booking or contact message comes in.</p>
        <div style={{ display: 'grid', gap: '16px' }}>
          <Field label="Notification Email"><input style={inp} value={form.notify_email} onChange={e => set('notify_email', e.target.value)} placeholder="bookings@khulacafe.co.za" /></Field>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.7)', fontSize: '13px', cursor: 'pointer' }}>
            <input type="checkbox" checked={!!form.notify_on_booking} onChange={e => set('notify_on_booking', e.target.checked)} /> Notify staff on new bookings
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.7)', fontSize: '13px', cursor: 'pointer' }}>
            <input type="checkbox" checked={!!form.notify_on_contact} onChange={e => set('notify_on_contact', e.target.checked)} /> Notify staff on new contact messages
          </label>
        </div>
      </div>

      {/* ── IMAP ── */}
      <div style={card}>
        <h2 style={sectionTitle}>Incoming Mail — IMAP</h2>
        <p style={sectionSub}>Your business mailbox's incoming credentials, stored for your records.</p>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
            <Field label="IMAP Host"><input style={inp} value={form.imap_host} onChange={e => set('imap_host', e.target.value)} placeholder="mail.khulacafe.co.za" /></Field>
            <Field label="Port"><input style={inp} type="number" value={form.imap_port} onChange={e => set('imap_port', e.target.value)} placeholder="993" /></Field>
          </div>
          <Field label="Username"><input style={inp} value={form.imap_username} onChange={e => set('imap_username', e.target.value)} placeholder="bookings@khulacafe.co.za" /></Field>
          <Field label="Password">
            <input type="password" autoComplete="off" style={inp}
              placeholder={initial?.has_imap_password ? 'Set — leave blank to keep' : '••••••••'}
              value={form.imap_password} onChange={e => set('imap_password', e.target.value)} />
          </Field>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.7)', fontSize: '13px', cursor: 'pointer' }}>
            <input type="checkbox" checked={!!form.imap_secure} onChange={e => set('imap_secure', e.target.checked)} /> Use SSL/TLS
          </label>
        </div>
      </div>

      {/* ── POP ── */}
      <div style={card}>
        <h2 style={sectionTitle}>Incoming Mail — POP3</h2>
        <p style={sectionSub}>Alternative POP3 credentials, if your provider uses POP instead of IMAP.</p>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
            <Field label="POP Host"><input style={inp} value={form.pop_host} onChange={e => set('pop_host', e.target.value)} placeholder="mail.khulacafe.co.za" /></Field>
            <Field label="Port"><input style={inp} type="number" value={form.pop_port} onChange={e => set('pop_port', e.target.value)} placeholder="995" /></Field>
          </div>
          <Field label="Username"><input style={inp} value={form.pop_username} onChange={e => set('pop_username', e.target.value)} placeholder="bookings@khulacafe.co.za" /></Field>
          <Field label="Password">
            <input type="password" autoComplete="off" style={inp}
              placeholder={initial?.has_pop_password ? 'Set — leave blank to keep' : '••••••••'}
              value={form.pop_password} onChange={e => set('pop_password', e.target.value)} />
          </Field>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.7)', fontSize: '13px', cursor: 'pointer' }}>
            <input type="checkbox" checked={!!form.pop_secure} onChange={e => set('pop_secure', e.target.checked)} /> Use SSL/TLS
          </label>
        </div>
      </div>

      {/* Save bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
        <button onClick={save} disabled={isPending} style={btnP}>{isPending ? 'Saving…' : 'Save Settings'}</button>
        {saved && <span style={{ color: '#26de81', fontSize: '13px' }}>✓ Saved</span>}
      </div>

      {/* ── Test email ── */}
      <div style={{ ...card, marginBottom: 0 }}>
        <h2 style={sectionTitle}>Send a Test Email</h2>
        <p style={sectionSub}>Save your settings first, then send yourself a test to confirm everything works.</p>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <input style={{ ...inp, flex: 1, minWidth: '220px' }} type="email" value={testTo} onChange={e => setTestTo(e.target.value)} placeholder="you@email.com" />
          <button onClick={runTest} disabled={isTesting || !testTo} style={btnG}>{isTesting ? 'Sending…' : 'Send Test'}</button>
        </div>
        {testResult && (
          <p style={{
            marginTop: '14px', fontSize: '13px', padding: '12px 14px', borderRadius: '8px', lineHeight: 1.6,
            background: testResult.ok ? 'rgba(38,222,129,0.1)' : 'rgba(248,113,113,0.1)',
            color: testResult.ok ? '#26de81' : '#f87171',
          }}>
            {testResult.ok ? '✓ Test email sent! Check your inbox (and spam folder).' : `✕ ${testResult.error}`}
          </p>
        )}
      </div>
    </div>
  )
}
