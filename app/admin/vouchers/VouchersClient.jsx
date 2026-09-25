'use client'
import { useState, useEffect, useTransition } from 'react'
import { createVoucher, setVoucherActive, deleteVoucher } from '../actions'
import { PageHeader } from '../../../components/admin/ui'
import VoucherCard, { VOUCHER_THEMES } from '../../../components/VoucherCard'

const CREATE_SQL = `CREATE TABLE IF NOT EXISTS "Khulacafe".vouchers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  amount_cents integer NOT NULL,
  active boolean NOT NULL DEFAULT true,
  expires_at date,
  redeemed_at timestamptz,
  redeemed_note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE "Khulacafe".bookings ADD COLUMN IF NOT EXISTS payment_note text;`

const inp = { width: '100%', padding: '10px 14px', background: '#0a0600', border: '1px solid #2e2000', borderRadius: '8px', color: '#fafafa', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }
const lbl = { display: 'block', fontSize: '10px', letterSpacing: '2px', color: '#f5c842', marginBottom: '6px', textTransform: 'uppercase' }
const btnP = { padding: '11px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #f5c842, #c8940c)', color: '#0a0600', fontWeight: 700, fontSize: '13px' }
const card = { background: '#1e1500', border: '1px solid #2e2000', borderRadius: '14px', padding: '22px', marginBottom: '20px' }

export default function VouchersClient({ initial, tableMissing }) {
  const [vouchers, setVouchers] = useState(initial || [])
  const [form, setForm] = useState({
    code: '', amount: '', expires_at: '',
    recipient_name: '', sender_name: '', message: '', theme: 'classic',
  })
  const [origin, setOrigin] = useState('')
  useEffect(() => { if (typeof window !== 'undefined') setOrigin(window.location.origin) }, [])
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

  function copySQL() {
    navigator.clipboard.writeText(CREATE_SQL)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  function add() {
    startTransition(async () => {
      const amount_cents = Math.round(parseFloat(form.amount || 0) * 100)
      const res = await createVoucher({
        code: form.code, amount_cents, expires_at: form.expires_at || null,
        recipient_name: form.recipient_name, sender_name: form.sender_name,
        message: form.message, theme: form.theme,
      })
      if (res?.error) { alert(res.error); return }
      const created = {
        id: `tmp-${Date.now()}`, code: form.code.trim().toUpperCase(), amount_cents,
        active: true, expires_at: form.expires_at || null, redeemed_at: null,
        recipient_name: form.recipient_name || null, sender_name: form.sender_name || null,
        message: form.message || null, theme: form.theme,
        created_at: new Date().toISOString(),
      }
      setForm({ code: '', amount: '', expires_at: '', recipient_name: '', sender_name: '', message: '', theme: 'classic' })
      setVouchers(v => [created, ...v])
    })
  }
  function toggle(v) {
    startTransition(async () => {
      await setVoucherActive(v.id, !v.active)
      setVouchers(list => list.map(x => x.id === v.id ? { ...x, active: !x.active } : x))
    })
  }
  function remove(v) {
    if (!confirm(`Delete voucher ${v.code}?`)) return
    startTransition(async () => {
      await deleteVoucher(v.id)
      setVouchers(list => list.filter(x => x.id !== v.id))
    })
  }

  function randomCode() {
    // deterministic-ish from time; user can edit
    const base = 'KHULA'
    const n = String(Date.now()).slice(-4)
    setForm(f => ({ ...f, code: `${base}${n}` }))
  }

  if (tableMissing) return (
    <div style={{ maxWidth: '680px' }}>
      <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '28px', color: '#fafafa', marginBottom: '8px' }}>Vouchers</h1>
      <div style={{ ...card, border: '1px solid #c8940c' }}>
        <div style={{ fontSize: '26px', marginBottom: '10px' }}>⚠️</div>
        <h2 style={{ color: '#f5c842', fontSize: '15px', marginBottom: '8px' }}>One-time database setup required</h2>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '16px', lineHeight: 1.7 }}>
          Run this SQL in your <a href="https://supabase.com/dashboard/project/bjggovjpsyjoflblwiaj/editor" target="_blank" style={{ color: '#f5c842' }}>Supabase SQL Editor</a>, then refresh.
        </p>
        <pre style={{ background: '#0a0600', border: '1px solid #2e2000', borderRadius: '8px', padding: '14px', fontSize: '11px', color: '#fafafa', whiteSpace: 'pre-wrap', wordBreak: 'break-word', marginBottom: '12px' }}>{CREATE_SQL}</pre>
        <button onClick={copySQL} style={{ ...btnP, background: copied ? '#166534' : btnP.background, color: copied ? '#fff' : '#0a0600' }}>{copied ? '✓ Copied!' : 'Copy SQL'}</button>
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: '680px' }}>
      <PageHeader title="Vouchers" subtitle="Gift voucher codes worth a fixed amount — redeemable at checkout or on a booking deposit, once each." />

      {/* Create */}
      <div style={card}>
        <p style={{ color: '#f5c842', fontSize: '10px', letterSpacing: '2px', marginBottom: '16px', textTransform: 'uppercase' }}>+ New Voucher</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
          <div>
            <label style={lbl}>Code</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="KHULA100" style={inp} />
              <button onClick={randomCode} title="Suggest a code" style={{ ...inp, width: 'auto', cursor: 'pointer', padding: '10px 12px' }}>🎲</button>
            </div>
          </div>
          <div>
            <label style={lbl}>Value (R)</label>
            <input type="number" min="0" step="10" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} placeholder="100" style={inp} />
          </div>
          <div>
            <label style={lbl}>Expires (optional)</label>
            <input type="date" min={new Date().toISOString().slice(0, 10)} value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} style={{ ...inp, colorScheme: 'dark' }} />
          </div>
        </div>
        {/* Who it is for, and what it says */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
          <div>
            <label style={lbl}>For (recipient)</label>
            <input value={form.recipient_name} onChange={e => setForm(f => ({ ...f, recipient_name: e.target.value }))} placeholder="Nokuphumula" style={inp} />
          </div>
          <div>
            <label style={lbl}>From (sender)</label>
            <input value={form.sender_name} onChange={e => setForm(f => ({ ...f, sender_name: e.target.value }))} placeholder="The Khula team" style={inp} />
          </div>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={lbl}>Greeting / message</label>
          <textarea
            value={form.message}
            maxLength={300}
            onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
            placeholder="Wishing you a wonderful day. Enjoy a meal on us!"
            style={{ ...inp, minHeight: '76px', resize: 'vertical', fontFamily: 'inherit', lineHeight: 1.6 }}
          />
          <p style={{ margin: '6px 0 0', fontSize: '11px', color: 'rgba(255,255,255,0.3)' }}>{form.message.length}/300</p>
        </div>

        <div style={{ marginBottom: '18px' }}>
          <label style={lbl}>Design template</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {Object.entries(VOUCHER_THEMES).map(([key, t]) => (
              <button
                key={key}
                onClick={() => setForm(f => ({ ...f, theme: key }))}
                style={{
                  cursor: 'pointer', padding: '9px 14px', borderRadius: '20px',
                  fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '7px',
                  background: form.theme === key ? 'linear-gradient(135deg,#f5c842,#c8940c)' : '#0a0600',
                  color: form.theme === key ? '#0a0600' : 'rgba(255,255,255,0.6)',
                  border: `1px solid ${form.theme === key ? 'transparent' : '#2e2000'}`,
                }}
              >
                <span>{t.motif}</span>{t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Live preview — exactly what the recipient will see */}
        <div style={{ marginBottom: '18px' }}>
          <label style={lbl}>Preview</label>
          <VoucherCard
            scale={0.82}
            voucher={{
              code: form.code || 'KHULA000',
              amount_cents: Math.round(parseFloat(form.amount || 0) * 100),
              expires_at: form.expires_at || null,
              recipient_name: form.recipient_name,
              sender_name: form.sender_name,
              message: form.message,
              theme: form.theme,
            }}
          />
        </div>

        <button onClick={add} disabled={isPending || !form.code || !form.amount} style={btnP}>{isPending ? 'Saving…' : 'Create Voucher'}</button>
      </div>

      {/* List */}
      {vouchers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: 'rgba(255,255,255,0.3)', fontSize: '14px' }}>No vouchers yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {vouchers.map(v => {
            const used = !!v.redeemed_at
            return (
              <div key={v.id} style={{ ...card, marginBottom: 0, padding: '14px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', opacity: (!v.active || used) ? 0.6 : 1 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '17px', color: '#fafafa', letterSpacing: '1px' }}>{v.code}</span>
                    <span style={{ color: '#f5c842', fontWeight: 700, fontSize: '14px' }}>R{(v.amount_cents / 100).toFixed(0)}</span>
                    {used && <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '1px' }}>Used</span>}
                    {!v.active && !used && <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '20px', background: 'rgba(255,107,107,0.15)', color: '#ff6b6b', textTransform: 'uppercase', letterSpacing: '1px' }}>Inactive</span>}
                  </div>
                  {v.expires_at && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>Expires {v.expires_at}</div>}
                  {used && v.redeemed_note && <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)', marginTop: '2px' }}>{v.redeemed_note}</div>}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                  {(() => {
                    const link = `${origin}/voucher/${v.code}`
                    const text = `${v.sender_name ? `${v.sender_name} has sent you` : "Here's"} a R${(v.amount_cents / 100).toFixed(0)} Khula Cafe gift voucher! Code ${v.code}. ${link}`
                    const small = { padding: '7px 12px', borderRadius: '8px', border: '1px solid #2e2000', background: 'transparent', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '12px', textDecoration: 'none' }
                    return (
                      <>
                        <a href={link} target="_blank" rel="noopener noreferrer" style={small}>View</a>
                        <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noopener noreferrer" style={{ ...small, borderColor: 'rgba(37,211,102,0.5)', color: '#25D366' }}>WhatsApp</a>
                        <a href={`mailto:?subject=${encodeURIComponent(`A R${(v.amount_cents / 100).toFixed(0)} Khula Cafe gift voucher for you`)}&body=${encodeURIComponent(text)}`} style={small}>Email</a>
                      </>
                    )
                  })()}
                  {!used && (
                    <button onClick={() => toggle(v)} style={{ padding: '7px 12px', borderRadius: '8px', border: '1px solid #2e2000', background: 'transparent', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: '12px' }}>
                      {v.active ? 'Deactivate' : 'Activate'}
                    </button>
                  )}
                  <button onClick={() => remove(v)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px' }}>🗑️</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
