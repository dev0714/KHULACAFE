'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import VoucherCard from '../../components/VoucherCard'
import { waHref } from '../../lib/contact-links'

const GOLD = '#f5c842'
const card = { background: '#1e1500', border: '1px solid #2e2000', borderRadius: '16px', padding: '26px' }
const btn = (primary) => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none',
  cursor: 'pointer', borderRadius: '30px', padding: '14px 26px', fontSize: '12px', fontWeight: 700,
  letterSpacing: '1.5px', textTransform: 'uppercase', whiteSpace: 'nowrap',
  border: primary ? 'none' : '1px solid #2e2000',
  background: primary ? 'linear-gradient(135deg, #f5c842, #c8940c)' : 'transparent',
  color: primary ? '#0a0600' : 'rgba(255,255,255,0.7)',
})

const STEPS = [
  { n: '01', title: 'Order food or book a table', body: 'Vouchers work at online checkout and towards a table booking deposit.' },
  { n: '02', title: 'Enter the code', body: 'Type the voucher code in the voucher box. It applies by itself and the amount comes straight off.' },
  { n: '03', title: 'Enjoy', body: 'Each voucher can be used once, before the expiry date printed on it.' },
]

export default function VouchersClient({ whatsapp, email }) {
  const router = useRouter()
  const [code, setCode] = useState('')

  const clean = code.trim().toUpperCase().replace(/\s+/g, '')
  const buyText = "Hi Khula Cafe, I'd like to buy a gift voucher."
  const wa = waHref(whatsapp, buyText)
  const mail = email ? `mailto:${email}?subject=${encodeURIComponent('Gift voucher')}&body=${encodeURIComponent(buyText)}` : null

  function check(e) {
    e.preventDefault()
    if (clean) router.push(`/voucher/${encodeURIComponent(clean)}`)
  }

  return (
    <>
      <div className="page-hero" style={{ borderBottom: '1px solid #2e2000' }}>
        <p className="section-label">Gift Vouchers</p>
        <h1 style={{ fontFamily: 'var(--font-playfair)' }}>Give the gift of Khula</h1>
        <p>A meal, a coffee date or a special occasion, on you. Vouchers are easy to send and easy to use.</p>
      </div>

      <section style={{ background: '#0a0600', padding: '60px 0 90px' }}>
        <div className="section-wrap" style={{ maxWidth: '980px' }}>

          {/* Example + check a code */}
          <div className="two-col-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '28px', alignItems: 'start', marginBottom: '48px' }}>
            <div>
              <p style={{ fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', margin: '0 0 12px' }}>Example voucher</p>
              <VoucherCard scale={0.9} voucher={{
                code: 'EXAMPLE', amount_cents: 20000, theme: 'birthday',
                recipient_name: 'Thandi', sender_name: 'Sipho',
                message: 'Happy birthday! Lunch is on me.', expires_at: null,
              }} />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <form onSubmit={check} style={card}>
                <h2 style={{ fontFamily: 'var(--font-playfair)', color: '#fafafa', fontSize: '22px', margin: '0 0 8px' }}>Have a voucher?</h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: 1.7, margin: '0 0 18px' }}>
                  Enter the code to see your voucher, its value and when it expires.
                </p>
                <input
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="Voucher code"
                  aria-label="Voucher code"
                  style={{
                    width: '100%', boxSizing: 'border-box', padding: '13px 16px', marginBottom: '12px',
                    background: '#0a0600', border: '1px solid #2e2000', borderRadius: '10px',
                    color: '#fafafa', fontSize: '15px', letterSpacing: '2px', outline: 'none',
                  }}
                />
                <button type="submit" disabled={!clean} style={{ ...btn(true), width: '100%', opacity: clean ? 1 : 0.5 }}>
                  Check my voucher
                </button>
              </form>

              <div style={card}>
                <h2 style={{ fontFamily: 'var(--font-playfair)', color: '#fafafa', fontSize: '22px', margin: '0 0 8px' }}>Get a voucher</h2>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '14px', lineHeight: 1.7, margin: '0 0 18px' }}>
                  Tell us the amount, who it is for and your message. We design it, and you can
                  send it on by WhatsApp or email.
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                  {wa && (
                    <a href={wa} target="_blank" rel="noopener noreferrer"
                       style={{ ...btn(true), background: 'linear-gradient(135deg,#25D366,#1da851)', color: '#04210f' }}>
                      WhatsApp us
                    </a>
                  )}
                  {mail && <a href={mail} style={btn(false)}>Email us</a>}
                </div>
              </div>
            </div>
          </div>

          {/* How it works */}
          <p style={{ fontSize: '10px', letterSpacing: '2px', textTransform: 'uppercase', color: GOLD, margin: '0 0 16px' }}>How to use a voucher</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '40px' }}>
            {STEPS.map(s => (
              <div key={s.n} style={card}>
                <p style={{ fontFamily: 'var(--font-playfair)', color: GOLD, fontSize: '28px', margin: '0 0 10px' }}>{s.n}</p>
                <p style={{ color: '#fafafa', fontSize: '15px', fontWeight: 600, margin: '0 0 6px' }}>{s.title}</p>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', lineHeight: 1.7, margin: 0 }}>{s.body}</p>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center' }}>
            <Link href="/menu" style={btn(true)}>Order food</Link>
            <Link href="/book" style={btn(false)}>Book a table</Link>
          </div>
        </div>
      </section>
    </>
  )
}
