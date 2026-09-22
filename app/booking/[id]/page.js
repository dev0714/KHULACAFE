'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { getBookingForCustomer, getAlternativeDates, rescheduleBooking, cancelBooking } from './actions'

const GOLD = '#f5c842'
const SLOTS = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00','19:00']

const card = { background: '#1e1500', border: '1px solid #2e2000', borderRadius: '14px', padding: '22px' }
const btn = (primary) => ({
  cursor: 'pointer', borderRadius: '30px', border: primary ? 'none' : '1px solid #2e2000',
  padding: '14px 26px', fontSize: '12px', fontWeight: 700, letterSpacing: '1.5px',
  textTransform: 'uppercase',
  background: primary ? 'linear-gradient(135deg, #f5c842, #c8940c)' : 'transparent',
  color: primary ? '#0a0600' : 'rgba(255,255,255,0.6)',
})
const chip = (active) => ({
  cursor: 'pointer', padding: '10px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
  background: active ? 'linear-gradient(135deg, #f5c842, #c8940c)' : '#241a00',
  color: active ? '#0a0600' : 'rgba(255,255,255,0.6)',
  border: `1px solid ${active ? 'transparent' : '#2e2000'}`, whiteSpace: 'nowrap',
})

const prettyDate = (d) => d ? new Date(d + 'T00:00:00').toLocaleDateString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''

export default function ManageBookingPage() {
  const { id } = useParams()
  const [booking, setBooking] = useState(null)
  const [alts, setAlts] = useState([])
  // view: 'summary' | 'reschedule' | 'reason' | 'moved' | 'cancelled'
  const [view, setView] = useState('summary')
  const [pickDate, setPickDate] = useState('')
  const [pickTime, setPickTime] = useState('')
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!id) return
    getBookingForCustomer(id).then(b => {
      setBooking(b ?? false)
      if (b) {
        setPickTime(b.time || '')
        getAlternativeDates(b.date).then(setAlts).catch(() => {})
        if (b.status === 'cancelled') setView('cancelled')
      }
    })
  }, [id])

  async function doReschedule() {
    setBusy(true); setError('')
    const res = await rescheduleBooking(id, pickDate, pickTime)
    setBusy(false)
    if (res?.error) setError(res.error)
    else { setBooking(b => ({ ...b, date: res.date, time: res.time })); setView('moved') }
  }

  async function doCancel() {
    setBusy(true); setError('')
    const res = await cancelBooking(id, reason)
    setBusy(false)
    if (res?.error) setError(res.error)
    else {
      setBooking(b => ({ ...b, refund_due_by: res.refundDueBy || null }))
      setView('cancelled')
    }
  }

  const wrap = { background: '#0a0600', minHeight: '100vh', padding: '80px 24px', display: 'flex', justifyContent: 'center' }
  const inner = { maxWidth: '560px', width: '100%' }

  if (booking === false) {
    return <div style={wrap}><div style={inner}><p style={{ color: 'rgba(255,255,255,0.45)', textAlign: 'center' }}>We could not find that booking.</p></div></div>
  }
  if (!booking) {
    return <div style={wrap}><div style={inner}><p style={{ color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>Loading…</p></div></div>
  }

  const deposit = `R${((booking.deposit_cents || 0) / 100).toFixed(0)}`

  return (
    <div style={wrap}>
      <div style={inner}>
        <h1 style={{ fontFamily: 'var(--font-playfair)', color: '#fafafa', fontSize: '32px', marginBottom: '6px' }}>Your booking</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '28px' }}>
          {booking.reference ? `Reference ${booking.reference}` : `Reference ${String(booking.id).slice(0, 8).toUpperCase()}`}
        </p>

        {/* Always-visible summary */}
        <div style={{ ...card, marginBottom: '20px' }}>
          <p style={{ margin: '0 0 10px', fontSize: '20px', color: '#fafafa', fontFamily: 'var(--font-playfair)' }}>
            {booking.booking_occasions?.emoji || '🍽️'} {booking.booking_occasions?.label || 'Table reservation'}
          </p>
          <p style={{ margin: '0 0 4px', color: GOLD, fontSize: '15px', fontWeight: 600 }}>
            {prettyDate(booking.date)} at {booking.time}
          </p>
          <p style={{ margin: '0 0 4px', color: 'rgba(255,255,255,0.55)', fontSize: '13px' }}>
            {booking.guests} guest{booking.guests === 1 ? '' : 's'} · {booking.customer_name}
          </p>
          {booking.status === 'cancelled' && (
            <p style={{ margin: '10px 0 0', color: '#ff8a7a', fontSize: '13px', fontWeight: 600 }}>This booking is cancelled.</p>
          )}
        </div>

        {view === 'cancelled' && (
          <div style={{ ...card, textAlign: 'center' }}>
            <p style={{ fontSize: '40px', margin: '0 0 12px' }}>😔</p>
            <h2 style={{ fontFamily: 'var(--font-playfair)', color: '#fafafa', fontSize: '22px', marginBottom: '10px' }}>Your booking is cancelled</h2>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: 1.7, marginBottom: '16px' }}>
              We are sorry to see this one go. You are welcome any time, and we would love to host you again.
            </p>
            {(booking.deposit_cents || 0) > 0 && (
              <div style={{ background: 'rgba(245,200,66,0.08)', border: '1px solid rgba(245,200,66,0.3)', borderRadius: '10px', padding: '14px 16px', marginBottom: '24px', textAlign: 'left' }}>
                <p style={{ margin: '0 0 6px', color: GOLD, fontSize: '12px', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 700 }}>Your refund</p>
                <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', fontSize: '13px', lineHeight: 1.6 }}>
                  Your {deposit} deposit will be processed within 7 working days
                  {booking.refund_due_by ? <> , by <strong style={{ color: '#fafafa' }}>{prettyDate(booking.refund_due_by)}</strong></> : null}.
                  It goes back to the card you paid with.
                </p>
              </div>
            )}
            <Link href="/book" style={{ ...btn(true), textDecoration: 'none', display: 'inline-block' }}>Make a new booking</Link>
          </div>
        )}

        {view === 'moved' && (
          <div style={{ ...card, textAlign: 'center' }}>
            <p style={{ fontSize: '40px', margin: '0 0 12px' }}>🎉</p>
            <h2 style={{ fontFamily: 'var(--font-playfair)', color: GOLD, fontSize: '22px', marginBottom: '10px' }}>Your booking has moved</h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px', lineHeight: 1.7, marginBottom: '20px' }}>
              We have you down for <strong style={{ color: '#fafafa' }}>{prettyDate(booking.date)} at {booking.time}</strong>.
              Your {deposit} deposit has moved across with it. See you then.
            </p>
            <Link href="/" style={{ ...btn(false), textDecoration: 'none', display: 'inline-block' }}>Back to site</Link>
          </div>
        )}

        {/* Step one: alternative dates in plain sight, before any cancel button */}
        {view === 'summary' && booking.status !== 'cancelled' && (
          <div style={card}>
            <h2 style={{ fontFamily: 'var(--font-playfair)', color: '#fafafa', fontSize: '20px', marginBottom: '10px' }}>
              Need to change your plans?
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '14px', lineHeight: 1.7, marginBottom: '18px' }}>
              The easiest thing is to move your booking. Your {deposit} deposit comes with you and
              there is nothing to pay again. Just pick a day below.
            </p>

            <p style={{ fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: GOLD, marginBottom: '10px' }}>
              Alternative dates available
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
              {alts.length === 0
                ? <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '13px' }}>Loading dates…</span>
                : alts.map(a => (
                  <button
                    key={a.date}
                    onClick={() => { setPickDate(a.date); setView('reschedule') }}
                    style={chip(false)}
                  >{a.label}</button>
                ))}
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <button onClick={() => setView('reschedule')} style={btn(true)}>Pick a different day or time</button>
              <button onClick={() => setView('reason')} style={btn(false)}>I need to cancel</button>
            </div>
          </div>
        )}

        {/* Step two: pick a new date */}
        {view === 'reschedule' && (
          <div style={card}>
            <h2 style={{ fontFamily: 'var(--font-playfair)', color: '#fafafa', fontSize: '20px', marginBottom: '6px' }}>Pick a new date</h2>
            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', marginBottom: '18px' }}>
              Your {deposit} deposit carries over, so there is nothing more to pay. We are closed on Sundays and Mondays.
            </p>

            <p style={{ fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: GOLD, marginBottom: '10px' }}>Next available dates</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
              {alts.map(a => (
                <button key={a.date} onClick={() => setPickDate(a.date)} style={chip(pickDate === a.date)}>{a.label}</button>
              ))}
            </div>

            <p style={{ fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: GOLD, marginBottom: '10px' }}>Or choose your own</p>
            <input
              type="date"
              value={pickDate}
              min={new Date().toISOString().slice(0, 10)}
              onChange={e => setPickDate(e.target.value)}
              style={{
                width: '100%', boxSizing: 'border-box', padding: '12px 14px', marginBottom: '20px',
                background: '#241a00', border: '1px solid #2e2000', borderRadius: '10px',
                color: '#fafafa', fontSize: '14px', outline: 'none', colorScheme: 'dark',
              }}
            />

            <p style={{ fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: GOLD, marginBottom: '10px' }}>Time</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '22px' }}>
              {SLOTS.map(t => <button key={t} onClick={() => setPickTime(t)} style={chip(pickTime === t)}>{t}</button>)}
            </div>

            {error && <p style={{ color: '#ff8a7a', fontSize: '13px', marginBottom: '14px' }}>{error}</p>}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <button onClick={doReschedule} disabled={busy || !pickDate || !pickTime} style={{ ...btn(true), opacity: busy || !pickDate || !pickTime ? 0.5 : 1 }}>
                {busy ? 'Saving…' : 'Confirm new date'}
              </button>
              <button onClick={() => { setView('summary'); setError('') }} style={btn(false)}>Back</button>
            </div>
          </div>
        )}

        {/* Step three: reason required before cancelling */}
        {view === 'reason' && (
          <div style={card}>
            <h2 style={{ fontFamily: 'var(--font-playfair)', color: '#fafafa', fontSize: '20px', marginBottom: '10px' }}>Before you cancel</h2>
            <div style={{ background: 'rgba(245,200,66,0.08)', border: '1px solid rgba(245,200,66,0.3)', borderRadius: '10px', padding: '14px 16px', marginBottom: '18px' }}>
              <p style={{ margin: '0 0 8px', color: GOLD, fontSize: '13px', fontWeight: 700, lineHeight: 1.6 }}>
                Cancelling because of unforeseen circumstances?
              </p>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.65)', fontSize: '13px', lineHeight: 1.6 }}>
                Your {deposit} deposit will be refunded within 7 working days. Please tell us what
                happened below so our team can process it.
              </p>
            </div>

            <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '13px', lineHeight: 1.6, marginBottom: '18px' }}>
              If your plans have only shifted, moving to another day is quicker for everyone
              and your deposit stays exactly where it is.
            </p>

            <label style={{ display: 'block', fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: GOLD, marginBottom: '8px' }}>
              Why are you cancelling? *
            </label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              maxLength={500}
              placeholder="Please tell us briefly what changed. It helps us improve."
              style={{
                width: '100%', boxSizing: 'border-box', minHeight: '110px', resize: 'vertical',
                background: '#241a00', border: '1px solid #2e2000', borderRadius: '10px',
                color: '#fafafa', fontSize: '14px', padding: '12px 14px', outline: 'none',
                fontFamily: 'inherit', lineHeight: 1.6, marginBottom: '18px',
              }}
            />

            {error && <p style={{ color: '#ff8a7a', fontSize: '13px', marginBottom: '14px' }}>{error}</p>}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
              <button onClick={() => setView('reschedule')} style={btn(true)}>Move my date instead</button>
              <button onClick={doCancel} disabled={busy || reason.trim().length < 5} style={{ ...btn(false), color: '#ff8a7a', borderColor: 'rgba(255,107,107,0.4)', opacity: busy || reason.trim().length < 5 ? 0.5 : 1 }}>
                {busy ? 'Cancelling…' : 'Cancel my booking'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
