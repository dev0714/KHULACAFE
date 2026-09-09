'use client'
import { useState, useTransition } from 'react'
import { savePaymentSettings, testPaymentConnectionAdmin } from '../actions'
import { PageHeader } from '../../../components/admin/ui'

const inp = { width: '100%', padding: '10px 14px', background: '#0a0600', border: '1px solid #2e2000', borderRadius: '8px', color: '#fafafa', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }
const lbl = { display: 'block', fontSize: '10px', letterSpacing: '2px', color: '#f5c842', marginBottom: '6px', textTransform: 'uppercase' }
const btnP = { padding: '11px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #f5c842, #c8940c)', color: '#0a0600', fontWeight: 700, fontSize: '13px' }
const btnG = { padding: '11px 22px', borderRadius: '8px', border: '1px solid #2e2000', cursor: 'pointer', background: 'transparent', color: 'rgba(255,255,255,0.6)', fontSize: '13px' }
const card = { background: '#1e1500', border: '1px solid #2e2000', borderRadius: '14px', padding: '24px', marginBottom: '20px' }
const title = { color: '#fafafa', fontSize: '16px', fontFamily: 'var(--font-playfair)', marginBottom: '4px' }
const sub = { color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginBottom: '20px', lineHeight: 1.6 }

function Field({ label, hint, children }) {
  return <div><label style={lbl}>{label}</label>{children}{hint && <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', margin: '6px 0 0' }}>{hint}</p>}</div>
}

export default function PaymentsClient({ initial }) {
  const [form, setForm] = useState(() => ({
    provider: initial?.provider || 'paysync',
    fn_base: initial?.fn_base || '',
    credential_id: initial?.credential_id || '',
    credential_key: '',
    secret_key: '',
    public_key: initial?.public_key || '',
    site_url: initial?.site_url || '',
  }))
  const [saved, setSaved] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [isPending, startTransition] = useTransition()
  const [isTesting, startTest] = useTransition()

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setSaved(false) }
  const isDirect = form.provider === 'paystack_direct'

  function save() {
    startTransition(async () => {
      const res = await savePaymentSettings(form)
      if (res?.error) { alert(`Could not save:\n${res.error}`); return }
      setSaved(true)
      setForm(f => ({ ...f, credential_key: '', secret_key: '' }))
    })
  }
  function test() {
    setTestResult(null)
    startTest(async () => { setTestResult(await testPaymentConnectionAdmin()) })
  }

  return (
    <div style={{ maxWidth: '680px' }}>
      <PageHeader title="Payments" subtitle="Configure how card payments are processed. Switch to the client's own Paystack with no redeploy." />

      {initial?.usingEnv && (
        <div style={{ background: 'rgba(245,200,66,0.08)', border: '1px solid rgba(245,200,66,0.3)', borderRadius: '10px', padding: '12px 16px', marginBottom: '24px', fontSize: '12px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
          ⚙️ Currently using the payment config from your <strong style={{ color: '#f5c842' }}>Vercel environment variables</strong> (shown below). Saving here stores the values in the database and overrides the environment. Secret keys are hidden — enter a new one only to change it.
        </div>
      )}

      {/* Provider */}
      <div style={card}>
        <h2 style={title}>Payment Method</h2>
        <p style={sub}>How payments reach Paystack.</p>
        <div style={{ display: 'grid', gap: '10px' }}>
          {[
            { v: 'paysync', title: 'PaySync proxy (current)', desc: 'Payments route through PaySync using a credential ID + key. Use the client\'s PaySync credentials.' },
            { v: 'paystack_direct', title: "Direct Paystack (client's own account)", desc: 'Call Paystack directly with the client\'s secret key (sk_live_… / sk_test_…). No proxy.' },
          ].map(o => (
            <label key={o.v} style={{
              display: 'flex', gap: '12px', alignItems: 'flex-start', padding: '14px', borderRadius: '10px', cursor: 'pointer',
              background: form.provider === o.v ? 'rgba(200,148,12,0.12)' : '#0a0600',
              border: `1px solid ${form.provider === o.v ? '#c8940c' : '#2e2000'}`,
            }}>
              <input type="radio" name="provider" checked={form.provider === o.v} onChange={() => set('provider', o.v)} style={{ marginTop: '2px' }} />
              <div>
                <div style={{ color: '#fafafa', fontSize: '13px', fontWeight: 600 }}>{o.title}</div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px', marginTop: '2px' }}>{o.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* PaySync fields */}
      <div style={{ ...card, opacity: isDirect ? 0.5 : 1 }}>
        <h2 style={title}>PaySync Credentials</h2>
        <p style={sub}>Used when the method above is PaySync proxy.</p>
        <div style={{ display: 'grid', gap: '16px' }}>
          <Field label="Proxy URL" hint="e.g. https://paysync.leadsync.co.za/functions/v1">
            <input style={inp} value={form.fn_base} onChange={e => set('fn_base', e.target.value)} placeholder="https://paysync.leadsync.co.za/functions/v1" />
          </Field>
          <Field label="Credential ID">
            <input style={inp} value={form.credential_id} onChange={e => set('credential_id', e.target.value)} placeholder="client credential id" />
          </Field>
          <Field label="Credential Key">
            <input type="password" autoComplete="off" style={inp}
              placeholder={initial?.has_credential_key ? `Set — ${initial.credential_key_preview} (leave blank to keep)` : 'client credential key'}
              value={form.credential_key} onChange={e => set('credential_key', e.target.value)} />
          </Field>
        </div>
      </div>

      {/* Direct Paystack fields */}
      <div style={{ ...card, opacity: isDirect ? 1 : 0.5 }}>
        <h2 style={title}>Direct Paystack Keys</h2>
        <p style={sub}>Used when the method above is Direct Paystack. Find these in the client's Paystack dashboard → Settings → API Keys.</p>
        <div style={{ display: 'grid', gap: '16px' }}>
          <Field label="Secret Key" hint="Kept private on the server — never shown to customers.">
            <input type="password" autoComplete="off" style={inp}
              placeholder={initial?.has_secret_key ? `Set — ${initial.secret_key_preview} (leave blank to keep)` : 'sk_live_… or sk_test_…'}
              value={form.secret_key} onChange={e => set('secret_key', e.target.value)} />
          </Field>
          <Field label="Public Key (optional)">
            <input style={inp} value={form.public_key} onChange={e => set('public_key', e.target.value)} placeholder="pk_live_… or pk_test_…" />
          </Field>
        </div>
      </div>

      {/* Common */}
      <div style={card}>
        <h2 style={title}>Site URL (optional)</h2>
        <p style={sub}>Where customers return after paying. Leave blank to auto-detect from the request.</p>
        <input style={inp} value={form.site_url} onChange={e => set('site_url', e.target.value)} placeholder="https://khulacafe.co.za" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px', flexWrap: 'wrap' }}>
        <button onClick={save} disabled={isPending} style={btnP}>{isPending ? 'Saving…' : 'Save Settings'}</button>
        <button onClick={test} disabled={isTesting} style={btnG}>{isTesting ? 'Testing…' : 'Test connection'}</button>
        {saved && <span style={{ color: '#26de81', fontSize: '13px' }}>✓ Saved</span>}
      </div>

      {testResult && (
        <p style={{
          fontSize: '13px', padding: '12px 14px', borderRadius: '8px', lineHeight: 1.6, marginTop: 0,
          background: testResult.ok ? 'rgba(38,222,129,0.1)' : 'rgba(248,113,113,0.1)',
          color: testResult.ok ? '#26de81' : '#f87171',
        }}>
          {testResult.ok ? `✓ Connected via ${testResult.provider}. ${testResult.note || ''}` : `✕ ${testResult.error}`}
        </p>
      )}
    </div>
  )
}
