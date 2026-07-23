'use client'
import { useState, useTransition } from 'react'
import { createVoucher, setVoucherActive, deleteVoucher } from '../actions'

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
  const [form, setForm] = useState({ code: '', amount: '', expires_at: '' })
  const [copied, setCopied] = useState(false)
  const [isPending, startTransition] = useTransition()

  function copySQL() {
    navigator.clipboard.writeText(CREATE_SQL)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  function add() {
    startTransition(async () => {
      const amount_cents = Math.round(parseFloat(form.amount || 0) * 100)
      const res = await createVoucher({ code: form.code, amount_cents, expires_at: form.expires_at || null })
      if (res?.error) { alert(res.error); return }
      setForm({ code: '', amount: '', expires_at: '' })
      // Optimistic add; refetch on next load. Prepend a temp row.
      setVouchers(v => [{ id: `tmp-${Date.now()}`, code: form.code.trim().toUpperCase(), amount_cents, active: true, expires_at: form.expires_at || null, redeemed_at: null, created_at: new Date().toISOString() }, ...v])
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
      <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '28px', color: '#fafafa', marginBottom: '6px' }}>Vouchers</h1>
      <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '24px', lineHeight: 1.6 }}>
        Create gift voucher codes worth a fixed amount. Customers enter the code at checkout or on the booking deposit. Each voucher can be used once.
      </p>

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
            <input type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))} style={{ ...inp, colorScheme: 'dark' }} />
          </div>
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
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
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
