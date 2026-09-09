'use client'
import { useState, useEffect, useTransition } from 'react'
import { supabase } from '../../../lib/supabase-public'
import { updateLoyaltyConfig } from '../actions'
import { PageHeader, Card, Btn, KpiTile, Icon } from '../../../components/admin/ui'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="adm-label">{label}</label>
      {children}
      {hint && <p style={{ color: 'var(--adm-faint)', fontSize: '11px', margin: '6px 0 0' }}>{hint}</p>}
    </div>
  )
}

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
  const set = (k, v) => { setConfig(c => ({ ...c, [k]: v })); setSaved(false) }

  const bucksPerR100 = Math.floor((config.earn_rate_points_per_rand * 100) / 100 * config.bucks_per_100_points)

  return (
    <>
      <PageHeader
        title="Khula Bucks"
        subtitle="Earn rates and rewards for the loyalty programme."
        actions={<Btn variant="primary" onClick={save} disabled={isPending}>{isPending ? 'Saving…' : saved ? <>{Icon.check(16)} Saved</> : 'Save changes'}</Btn>}
      />

      <div className="admin-stat-grid adm-stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <KpiTile label="Earn rate" value={`${config.earn_rate_points_per_rand} pt / R1`} hint="Points per rand spent" />
        <KpiTile label="R100 spent earns" value={`${bucksPerR100} bucks`} hint="1 Khula Buck = R1 off" color="var(--adm-gold)" />
        <KpiTile label="Gold discount" value={`${config.gold_discount_pct}%`} hint={`Every ${config.gold_discount_day}`} />
      </div>

      <div className="admin-chart-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '16px', maxWidth: '900px' }}>
        <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '17px', fontWeight: 700 }}>Earn rate</span>
            <p style={{ fontSize: '12px', color: 'var(--adm-faint)', margin: '4px 0 0' }}>How spending converts into Khula Bucks.</p>
          </div>
          <Field label="Points per R1 spent" hint={`R100 spent = ${config.earn_rate_points_per_rand * 100} points → ${bucksPerR100} Khula Bucks`}>
            <input className="adm-input" type="number" min="1" value={config.earn_rate_points_per_rand} onChange={e => set('earn_rate_points_per_rand', parseInt(e.target.value) || 1)} />
          </Field>
          <Field label="Khula Bucks per 100 points">
            <input className="adm-input" type="number" min="1" value={config.bucks_per_100_points} onChange={e => set('bucks_per_100_points', parseInt(e.target.value) || 1)} />
          </Field>
        </Card>

        <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '17px', fontWeight: 700 }}>Khula Gold tier</span>
            <p style={{ fontSize: '12px', color: 'var(--adm-faint)', margin: '4px 0 0' }}>The perk Gold members receive.</p>
          </div>
          <Field label="Discount %">
            <input className="adm-input" type="number" min="1" max="100" value={config.gold_discount_pct} onChange={e => set('gold_discount_pct', parseInt(e.target.value) || 1)} />
          </Field>
          <Field label="Discount day">
            <select className="adm-input" value={config.gold_discount_day} onChange={e => set('gold_discount_day', e.target.value)}>
              {DAYS.map(d => <option key={d}>{d}</option>)}
            </select>
          </Field>
        </Card>

        <Card style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '12px', gridColumn: '1/-1' }}>
          <div>
            <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '17px', fontWeight: 700 }}>Live status message</span>
            <p style={{ fontSize: '12px', color: 'var(--adm-faint)', margin: '4px 0 0' }}>Shown in the website footer next to the trading hours. Update it for load-shedding or holidays.</p>
          </div>
          <input className="adm-input" value={config.status_message} onChange={e => set('status_message', e.target.value)} />
        </Card>
      </div>
    </>
  )
}
