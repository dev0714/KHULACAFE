'use client'
import { useState, useEffect, useTransition } from 'react'
import { supabase } from '../../../lib/supabase-public'
import { updateLoyaltyConfig } from '../actions'

const inputStyle = { width: '100%', padding: '10px 14px', background: '#0a0600', border: '1px solid #2e2000', borderRadius: '8px', color: '#fafafa', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }
const labelStyle = { display: 'block', fontSize: '10px', letterSpacing: '2px', color: '#f5c842', marginBottom: '6px', textTransform: 'uppercase' }

export default function LoyaltyAdmin() {
  const [config, setConfig] = useState({
    earn_rate_points_per_rand: 1,
    bucks_per_100_points: 10,
    gold_discount_pct: 15,
    gold_discount_day: 'Tuesday',
    status_message: 'Open & cooking on gas/generators',
  })
  const [saved, setSaved] = useState(false)
  const [isPending, startTransition] = useTransition()

  useEffect(() => {
    supabase.from('loyalty_config').select('*').eq('id', 1).single().then(({ data }) => { if (data) setConfig(data) })
  }, [])

  function save() {
    startTransition(async () => {
      await updateLoyaltyConfig(config)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    })
  }

  return (
    <>
      <h1 style={{ fontFamily: 'var(--font-playfair)', color: '#fafafa', fontSize: '28px', marginBottom: '32px' }}>Khula Bucks Configuration</h1>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', maxWidth: '800px' }}>
        <div style={{ background: '#1e1500', border: '1px solid #2e2000', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ color: '#f5c842', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '18px' }}>Earn Rate</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Points per R1 spent</label>
              <input type="number" min="1" value={config.earn_rate_points_per_rand} onChange={e => setConfig(c => ({ ...c, earn_rate_points_per_rand: parseInt(e.target.value) || 1 }))} style={inputStyle} />
              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '11px', marginTop: '5px' }}>R100 spent = {config.earn_rate_points_per_rand * 100} points → {config.bucks_per_100_points} Khula Bucks</p>
            </div>
            <div>
              <label style={labelStyle}>Khula Bucks per 100 points</label>
              <input type="number" min="1" value={config.bucks_per_100_points} onChange={e => setConfig(c => ({ ...c, bucks_per_100_points: parseInt(e.target.value) || 1 }))} style={inputStyle} />
            </div>
          </div>
        </div>

        <div style={{ background: '#1e1500', border: '1px solid #2e2000', borderRadius: '12px', padding: '24px' }}>
          <h2 style={{ color: '#f5c842', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '18px' }}>Khula Gold Tier</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Discount %</label>
              <input type="number" min="1" max="100" value={config.gold_discount_pct} onChange={e => setConfig(c => ({ ...c, gold_discount_pct: parseInt(e.target.value) || 1 }))} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Discount day</label>
              <select value={config.gold_discount_day} onChange={e => setConfig(c => ({ ...c, gold_discount_day: e.target.value }))} style={inputStyle}>
                {['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div style={{ background: '#1e1500', border: '1px solid #2e2000', borderRadius: '12px', padding: '24px', gridColumn: '1/-1' }}>
          <h2 style={{ color: '#f5c842', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', marginBottom: '10px' }}>Live Status Message</h2>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', marginBottom: '12px' }}>Shown in the footer hours section. Update for loadshedding or holidays.</p>
          <input value={config.status_message} onChange={e => setConfig(c => ({ ...c, status_message: e.target.value }))} style={inputStyle} />
        </div>
      </div>

      <button onClick={save} disabled={isPending} style={{ marginTop: '24px', padding: '14px 40px', borderRadius: '10px', border: 'none', cursor: isPending ? 'not-allowed' : 'pointer', background: saved ? '#1a3d0f' : 'linear-gradient(135deg, #f5c842, #c8940c)', color: saved ? '#5ddd3a' : '#0a0600', fontWeight: 700, fontSize: '13px', letterSpacing: '2px', transition: 'all 0.3s' }}>
        {isPending ? 'Saving…' : saved ? '✓ Saved' : 'Save Configuration'}
      </button>
    </>
  )
}
