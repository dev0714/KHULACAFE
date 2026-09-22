'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase-public'
import { submitFeedback } from './actions'

const GOLD = '#f5c842'

function Stars({ value, onChange, label }) {
  const [hover, setHover] = useState(0)
  const shown = hover || value
  return (
    <div style={{ marginBottom: '28px' }}>
      <p style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: GOLD, marginBottom: '12px' }}>{label}</p>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }} onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            aria-label={`${n} out of 5`}
            onClick={() => onChange(n)}
            onMouseEnter={() => setHover(n)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '4px',
              fontSize: '40px', lineHeight: 1,
              color: n <= shown ? GOLD : 'rgba(255,255,255,0.18)',
              transition: 'transform 0.12s, color 0.12s',
              transform: n <= shown ? 'scale(1.06)' : 'scale(1)',
            }}
          >★</button>
        ))}
      </div>
    </div>
  )
}

export default function FeedbackPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [service, setService] = useState(0)
  const [food, setFood] = useState(0)
  const [comment, setComment] = useState('')
  const [done, setDone] = useState(false)
  const [already, setAlready] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    supabase.from('orders').select('id, customer_name').eq('id', id).single()
      .then(({ data }) => setOrder(data || false))
    supabase.from('order_feedback').select('id').eq('order_id', id).maybeSingle()
      .then(({ data }) => { if (data) setAlready(true) })
  }, [id])

  async function submit(e) {
    e.preventDefault()
    if (!service || !food) { setError('Please give both a service and a food rating.'); return }
    setSaving(true); setError('')
    const res = await submitFeedback({ orderId: id, service, food, comment })
    setSaving(false)
    if (res?.error) setError(res.error)
    else setDone(true)
  }

  const wrap = { background: '#0a0600', minHeight: '100vh', padding: '80px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }
  const card = { maxWidth: '460px', width: '100%', textAlign: 'center' }

  if (order === false) {
    return <div style={wrap}><div style={card}><p style={{ color: 'rgba(255,255,255,0.45)' }}>We could not find that order.</p></div></div>
  }
  if (!order) {
    return <div style={wrap}><div style={card}><p style={{ color: 'rgba(255,255,255,0.4)' }}>Loading…</p></div></div>
  }

  if (done || already) {
    return (
      <div style={wrap}>
        <div style={card}>
          <div style={{ fontSize: '56px', marginBottom: '20px' }}>💛</div>
          <h1 style={{ fontFamily: 'var(--font-playfair)', color: GOLD, fontSize: '32px', marginBottom: '10px' }}>Thank you!</h1>
          <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: '32px' }}>
            {already && !done
              ? 'You have already rated this order. Thank you for taking the time.'
              : 'Your rating helps us serve you better next time.'}
          </p>
          <Link href="/menu" style={{
            textDecoration: 'none', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase',
            fontWeight: 700, color: '#0a0600', padding: '14px 32px', borderRadius: '50px',
            background: 'linear-gradient(135deg, #f5c842, #c8940c)', display: 'inline-block',
          }}>Order again</Link>
        </div>
      </div>
    )
  }

  return (
    <div style={wrap}>
      <form onSubmit={submit} style={card}>
        <h1 style={{ fontFamily: 'var(--font-playfair)', color: '#fafafa', fontSize: '30px', marginBottom: '8px' }}>
          How did we do{order.customer_name ? `, ${order.customer_name}` : ''}?
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '14px', lineHeight: 1.7, marginBottom: '36px' }}>
          Rate us out of five stars. It takes a few seconds and it genuinely helps.
        </p>

        <Stars label="Our service" value={service} onChange={setService} />
        <Stars label="The taste of the food" value={food} onChange={setFood} />

        <textarea
          value={comment}
          onChange={e => setComment(e.target.value)}
          maxLength={500}
          placeholder="Anything you would like to tell us? (optional)"
          style={{
            width: '100%', boxSizing: 'border-box', minHeight: '90px', resize: 'vertical',
            background: '#1e1500', border: '1px solid #2e2000', borderRadius: '10px',
            color: '#fafafa', fontSize: '14px', padding: '12px 14px', outline: 'none',
            fontFamily: 'inherit', lineHeight: 1.6, marginBottom: '20px',
          }}
        />

        {error && <p style={{ color: '#ff8a7a', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}

        <button type="submit" disabled={saving} style={{
          width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
          cursor: saving ? 'wait' : 'pointer', fontSize: '12px', fontWeight: 700,
          letterSpacing: '2px', textTransform: 'uppercase', color: '#0a0600',
          background: 'linear-gradient(135deg, #f5c842, #c8940c)', opacity: saving ? 0.6 : 1,
        }}>
          {saving ? 'Sending…' : 'Send my rating'}
        </button>
      </form>
    </div>
  )
}
