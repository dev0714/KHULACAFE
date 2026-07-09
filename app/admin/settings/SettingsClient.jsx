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
  imap_host text, imap_port int, imap_username text, imap_password text, imap_secure boolean DEFAULT true,
  pop_host text, pop_port int, pop_username text, pop_password text, pop_secure boolean DEFAULT true,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT email_settings_singleton CHECK (id = 1)
);
INSERT INTO "Khulacafe".email_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;`

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

export default function SettingsClient({ initial, tableMissing }) {
  const [form, setForm] = useState(() => ({
    from_name: initial?.from_name ?? 'Khula Cafe',
    from_email: initial?.from_email ?? 'orders@khulacafe.co.za',
    reply_to: initial?.reply_to ?? '',
    resend_api_key: '',
    notify_email: initial?.notify_email ?? '',
    notify_on_booking: initial?.notify_on_booking ?? true,
    notify_on_contact: initial?.notify_on_contact ?? true,
    imap_host: initial?.imap_host ?? '',
    imap_port: initial?.imap_port ?? '',
    imap_username: initial?.imap_username ?? '',
    imap_password: '',
    imap_secure: initial?.imap_secure ?? true,
    pop_host: initial?.pop_host ?? '',
    pop_port: initial?.pop_port ?? '',
    pop_username: initial?.pop_username ?? '',
    pop_password: '',
    pop_secure: initial?.pop_secure ?? true,
  }))
  const [saved, setSaved] = useState(false)
  const [testTo, setTestTo] = useState('')
  const [testResult, setTestResult] = useState(null)
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isTesting, startTest] = useTransition()

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setSaved(false) }

  function copySQL() {
    navigator.clipboard.writeText(CREATE_SQL)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  function save() {
    startTransition(async () => {
      const payload = { ...form }
      payload.imap_port = payload.imap_port === '' ? null : Number(payload.imap_port)
      payload.pop_port = payload.pop_port === '' ? null : Number(payload.pop_port)
      const result = await saveEmailSettings(payload)
      if (result?.error) { alert(`Could not save:\n${result.error}`); return }
      setSaved(true)
      // Clear secret inputs after a successful save so they show as "set".
      setForm(f => ({ ...f, resend_api_key: '', imap_password: '', pop_password: '' }))
    })
  }

  function runTest() {
    setTestResult(null)
    startTest(async () => {
      const r = await sendTestEmailAdmin(testTo)
      setTestResult(r)
    })
  }

  if (tableMissing) return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '28px', color: '#fafafa', marginBottom: '8px' }}>Email Settings</h1>
      <div style={{ ...card, border: '1px solid #c8940c', maxWidth: '680px' }}>
        <div style={{ fontSize: '28px', marginBottom: '12px' }}>⚠️</div>
        <h2 style={{ color: '#f5c842', fontSize: '16px', marginBottom: '8px' }}>One-time database setup required</h2>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '20px', lineHeight: 1.7 }}>
          Run the SQL below in your <a href="https://supabase.com/dashboard/project/bjggovjpsyjoflblwiaj/editor" target="_blank" style={{ color: '#f5c842' }}>Supabase SQL Editor</a>, then refresh this page.
        </p>
        <pre style={{ background: '#0a0600', border: '1px solid #2e2000', borderRadius: '8px', padding: '16px', fontSize: '11px', color: '#fafafa', whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: '12px' }}>{CREATE_SQL}</pre>
        <button onClick={copySQL} style={{ ...btnP, background: copied ? '#166534' : btnP.background, color: copied ? '#fff' : '#0a0600' }}>
          {copied ? '✓ Copied!' : 'Copy SQL'}
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: '680px' }}>
      <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '28px', color: '#fafafa', marginBottom: '6px' }}>Email Settings</h1>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '28px', lineHeight: 1.6 }}>
        Configure how Khula Cafe sends booking, order, and contact-form emails. Changes take effect immediately — no redeploy needed.
      </p>

      {/* ── Sending (Resend) ── */}
      <div style={card}>
        <h2 style={sectionTitle}>Sending — Resend</h2>
        <p style={sectionSub}>
          Transactional emails send via <a href="https://resend.com" target="_blank" style={{ color: '#f5c842' }}>Resend</a>. Paste your API key and set the sender.
          The <strong>From email's domain must be verified in Resend</strong>, otherwise sends are rejected.
        </p>
        <div style={{ display: 'grid', gap: '16px' }}>
          <Field label="Resend API Key">
            <input type="password" autoComplete="off" style={inp}
              placeholder={initial?.has_resend_api_key ? `Set — ${initial.resend_api_key_preview} (leave blank to keep)` : 're_xxxxxxxxxxxxxxxx'}
              value={form.resend_api_key} onChange={e => set('resend_api_key', e.target.value)} />
          </Field>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Field label="From Name">
              <input style={inp} value={form.from_name} onChange={e => set('from_name', e.target.value)} placeholder="Khula Cafe" />
            </Field>
            <Field label="From Email">
              <input style={inp} value={form.from_email} onChange={e => set('from_email', e.target.value)} placeholder="orders@khulacafe.co.za" />
            </Field>
          </div>
          <Field label="Reply-To (optional)">
            <input style={inp} value={form.reply_to} onChange={e => set('reply_to', e.target.value)} placeholder="hello@khulacafe.co.za" />
          </Field>
        </div>
      </div>

      {/* ── Staff notifications ── */}
      <div style={card}>
        <h2 style={sectionTitle}>Staff Notifications</h2>
        <p style={sectionSub}>Get an email to your team whenever a new booking or contact message comes in.</p>
        <div style={{ display: 'grid', gap: '16px' }}>
          <Field label="Notification Email">
            <input style={inp} value={form.notify_email} onChange={e => set('notify_email', e.target.value)} placeholder="team@khulacafe.co.za" />
          </Field>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.7)', fontSize: '13px', cursor: 'pointer' }}>
            <input type="checkbox" checked={!!form.notify_on_booking} onChange={e => set('notify_on_booking', e.target.checked)} />
            Notify staff on new bookings
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'rgba(255,255,255,0.7)', fontSize: '13px', cursor: 'pointer' }}>
            <input type="checkbox" checked={!!form.notify_on_contact} onChange={e => set('notify_on_contact', e.target.checked)} />
            Notify staff on new contact messages
          </label>
        </div>
      </div>

      {/* ── Incoming mail IMAP ── */}
      <div style={card}>
        <h2 style={sectionTitle}>Incoming Mail — IMAP</h2>
        <p style={sectionSub}>Your business mailbox credentials, stored securely for your records and future inbox integration.</p>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
            <Field label="IMAP Host"><input style={inp} value={form.imap_host} onChange={e => set('imap_host', e.target.value)} placeholder="imap.yourhost.co.za" /></Field>
            <Field label="Port"><input style={inp} type="number" value={form.imap_port} onChange={e => set('imap_port', e.target.value)} placeholder="993" /></Field>
          </div>
          <Field label="Username"><input style={inp} value={form.imap_username} onChange={e => set('imap_username', e.target.value)} placeholder="hello@khulacafe.co.za" /></Field>
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

      {/* ── Incoming mail POP ── */}
      <div style={card}>
        <h2 style={sectionTitle}>Incoming Mail — POP3</h2>
        <p style={sectionSub}>Alternative POP3 credentials, if your provider uses POP instead of IMAP.</p>
        <div style={{ display: 'grid', gap: '16px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
            <Field label="POP Host"><input style={inp} value={form.pop_host} onChange={e => set('pop_host', e.target.value)} placeholder="pop.yourhost.co.za" /></Field>
            <Field label="Port"><input style={inp} type="number" value={form.pop_port} onChange={e => set('pop_port', e.target.value)} placeholder="995" /></Field>
          </div>
          <Field label="Username"><input style={inp} value={form.pop_username} onChange={e => set('pop_username', e.target.value)} placeholder="hello@khulacafe.co.za" /></Field>
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
