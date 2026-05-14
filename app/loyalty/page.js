'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import { supabase } from '../../lib/supabase-public'

export default function LoyaltyPage() {
  useScrollReveal()
  const [loyaltyConfig, setLoyaltyConfig] = useState({ bucks_per_100_points: 10, gold_discount_pct: 15, gold_discount_day: 'Tuesday' })

  useEffect(() => {
    supabase.from('loyalty_config').select('*').eq('id', 1).single()
      .then(({ data }) => { if (data) setLoyaltyConfig(data) })
  }, [])

  const steps = [
    { n: '01', title: 'Dine or Order', text: 'Every purchase at Khula Cafe earns you points. Sit-down, takeaway, or delivery — all count.' },
    { n: '02', title: 'Earn Khula Bucks', text: `R1 spent = 1 point. Every R100 earns you ${loyaltyConfig.bucks_per_100_points} Khula Bucks — that's a ${loyaltyConfig.bucks_per_100_points}% reward on everything.` },
    { n: '03', title: 'Redeem Rewards', text: 'Use your Khula Bucks on your next visit. Pay for food, drinks, or add-ons directly from your wallet.' },
  ]

  const features = [
    { icon: '💬', title: 'WhatsApp AI — Apollo', text: 'Order in isiZulu, Afrikaans, Sesotho, or English. Apollo processes your order instantly and sends a payment link.' },
    { icon: '🚚', title: 'Geofenced Delivery', text: 'Free delivery within 5km. Live map tracking so you always know where your order is.' },
    { icon: '⚡', title: 'Loadshedding Live', text: 'We display our live status — open, cooking on gas, or on generator. Because South African planning is real.' },
    { icon: '📊', title: 'Pulse Feedback', text: '30 minutes after your visit, a quick 1-5 star notification. Your voice shapes our kitchen.' },
  ]

  return (
    <>
      <div className="page-hero">
        <p className="section-label">Rewards Programme</p>
        <h1 style={{ fontFamily: 'var(--font-playfair)' }}>Khula Bucks</h1>
        <p>Dine more. Earn more. Because loyalty deserves rewards.</p>
      </div>

      {/* How it works */}
      <section style={{ padding: '100px 0', background: '#0a0600' }}>
        <div className="section-wrap">
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <p className="section-label" data-reveal>Simple & Rewarding</p>
            <h2 data-reveal data-delay="100" style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, color: '#fafafa' }}>
              How Khula Bucks Work
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '24px', marginBottom: '64px' }}>
            {steps.map((s, i) => (
              <div key={i} className="card-lift" data-reveal data-delay={`${i * 150}`} style={{
                background: '#1e1500', border: '1px solid #2e2000', borderRadius: '16px', padding: '32px',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  fontFamily: 'var(--font-playfair)', fontSize: '64px', fontWeight: 900,
                  color: '#2e2000', position: 'absolute', top: '16px', right: '20px', lineHeight: 1,
                }}>{s.n}</div>
                <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '22px', color: '#fafafa', marginBottom: '12px', position: 'relative' }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.8, position: 'relative' }}>
                  {s.text}
                </p>
              </div>
            ))}
          </div>

          {/* Earning rate */}
          <div data-reveal style={{
            background: 'linear-gradient(105deg, #7d5a0b 0%, #c8940c 18%, #f5c842 38%, #fffbe0 52%, #f5c842 66%, #c8940c 82%, #7d5a0b 100%)',
            border: '1px solid #3d2a00', borderRadius: '20px',
            padding: '48px', textAlign: 'center',
          }}>
            <p style={{ fontSize: '11px', letterSpacing: '4px', textTransform: 'uppercase', color: '#3d2200', marginBottom: '16px' }}>
              Earning Rate
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '56px', fontWeight: 700, color: '#0a0600' }}>R100</div>
                <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.5)', letterSpacing: '2px' }}>SPENT</div>
              </div>
              <div style={{ fontSize: '32px', color: 'rgba(0,0,0,0.3)' }}>=</div>
              <div>
                <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '56px', fontWeight: 700, color: '#0a0600' }}>{loyaltyConfig.bucks_per_100_points}</div>
                <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.5)', letterSpacing: '2px' }}>KHULA BUCKS</div>
              </div>
            </div>
            <p style={{ fontSize: '14px', color: 'rgba(0,0,0,0.6)', marginTop: '16px' }}>
              That's <strong style={{ color: '#3d2200' }}>10% back</strong> on every rand you spend at Khula Cafe.
            </p>
          </div>
        </div>
      </section>

      {/* Khula Gold tier */}
      <section id="gold" style={{ padding: '100px 0', background: '#140e00' }}>
        <div className="section-wrap">
          <div className="two-col-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '48px', alignItems: 'center' }}>
            <div>
              <p className="section-label" data-reveal>Premium Tier</p>
              <h2 data-reveal data-delay="100" style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, color: '#fafafa', marginBottom: '24px' }}>
                Khula Gold 🏅
              </h2>
              <p data-reveal data-delay="200" style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.9, marginBottom: '20px' }}>
                We believe in looking after our community. <strong style={{ color: '#f5c842' }}>Pensioners and students</strong> qualify for Khula Gold — a permanent discount tier that rewards loyalty and makes quality food accessible.
              </p>
              <div data-reveal data-delay="300" style={{
                background: '#1e1500', border: '1px solid rgba(245,200,66,0.25)',
                borderRadius: '14px', padding: '24px', marginBottom: '32px',
              }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <span style={{ fontSize: '24px' }}>💛</span>
                  <div>
                    <h4 style={{ color: '#f5c842', fontSize: '16px', marginBottom: '4px' }}>{loyaltyConfig.gold_discount_pct}% off every {loyaltyConfig.gold_discount_day}</h4>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>Upload your ID or student card once in the app to unlock permanent Khula Gold status.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '24px' }}>📱</span>
                  <div>
                    <h4 style={{ color: '#f5c842', fontSize: '16px', marginBottom: '4px' }}>Verified once, active forever</h4>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>One photo upload is all it takes. No renewal, no complications.</p>
                  </div>
                </div>
              </div>
              <Link data-reveal data-delay="400" href="/contact" style={{
                textDecoration: 'none', fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase',
                fontWeight: 600, color: '#0a0600', padding: '14px 40px', borderRadius: '50px',
                background: 'linear-gradient(135deg, #f5c842, #c8940c)',
                display: 'inline-block', boxShadow: '0 6px 20px rgba(200,148,12,0.35)',
              }}>
                Apply for Khula Gold
              </Link>
            </div>
            <div data-reveal="right" style={{
              background: 'linear-gradient(135deg, #7d5a0b 0%, #3d2200 100%)',
              border: '1px solid rgba(245,200,66,0.2)', borderRadius: '20px',
              padding: '48px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏅</div>
              <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '28px', color: '#f5c842', marginBottom: '8px' }}>Khula Gold</h3>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '32px' }}>For pensioners & students</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[`${loyaltyConfig.gold_discount_pct}% off every ${loyaltyConfig.gold_discount_day}`, 'Priority WhatsApp support', 'Exclusive monthly deals', 'Early access to new menu items'].map((perk, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#f5c842', fontSize: '14px' }}>✓</span>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)' }}>{perk}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* App features */}
      <section style={{ padding: '100px 0', background: '#0a0600' }}>
        <div className="section-wrap">
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <p className="section-label" data-reveal>The Connect App</p>
            <h2 data-reveal data-delay="100" style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, color: '#fafafa' }}>
              More Than Loyalty
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            {features.map((f, i) => (
              <div key={i} className="card-lift" data-reveal data-delay={`${i * 100}`} style={{
                background: 'linear-gradient(160deg, #2a1c00 0%, #1e1500 60%, #140e00 100%)',
                border: '1px solid #2e2000', borderRadius: '16px', padding: '28px',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  position: 'absolute', top: 0, left: '28px', right: '28px', height: '2px',
                  background: 'linear-gradient(90deg, transparent, #f5c842, transparent)',
                }} />
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: 'rgba(245,200,66,0.1)', border: '1px solid rgba(245,200,66,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px', marginBottom: '18px',
                }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '18px', color: '#fafafa', marginBottom: '10px' }}>{f.title}</h3>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, margin: 0 }}>{f.text}</p>
                <div style={{
                  position: 'absolute', bottom: '-20px', right: '-20px',
                  width: '80px', height: '80px', borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(245,200,66,0.06) 0%, transparent 70%)',
                  pointerEvents: 'none',
                }} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
