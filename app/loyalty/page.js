'use client'
import Link from 'next/link'
import { useScrollReveal } from '../../hooks/useScrollReveal'

export default function LoyaltyPage() {
  useScrollReveal()

  const steps = [
    { n: '01', title: 'Dine or Order', text: 'Every purchase at Khula Cafe earns you points. Sit-down, takeaway, or delivery — all count.' },
    { n: '02', title: 'Earn Khula Bucks', text: 'R1 spent = 1 point. Every R100 earns you 10 Khula Bucks — that\'s a 10% reward on everything.' },
    { n: '03', title: 'Redeem Rewards', text: 'Use your Khula Bucks on your next visit. Pay for food, drinks, or add-ons directly from your wallet.' },
  ]

  const features = [
    { icon: '💬', title: 'WhatsApp AI — Apollo', color: '#25D366', text: 'Order in isiZulu, Afrikaans, Sesotho, or English. Apollo processes your order instantly and sends a payment link.' },
    { icon: '🚚', title: 'Geofenced Delivery', color: '#f5a623', text: 'Free delivery within 5km. Live map tracking so you always know where your order is.' },
    { icon: '⚡', title: 'Loadshedding Live', color: '#39ff14', text: 'We display our live status — open, cooking on gas, or on generator. Because South African planning is real.' },
    { icon: '📊', title: 'Pulse Feedback', color: '#57cc99', text: '30 minutes after your visit, a quick 1-5 star notification. Your voice shapes our kitchen.' },
  ]

  return (
    <>
      <div className="page-hero">
        <p className="section-label">Rewards Programme</p>
        <h1 style={{ fontFamily: 'var(--font-playfair)' }}>Khula Bucks</h1>
        <p>Dine more. Earn more. Because loyalty deserves rewards.</p>
      </div>

      {/* How it works */}
      <section style={{ padding: '100px 0', background: '#040d07' }}>
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
                background: '#0d2818', border: '1px solid #1a3a22', borderRadius: '16px', padding: '32px',
                position: 'relative', overflow: 'hidden',
              }}>
                <div style={{
                  fontFamily: 'var(--font-playfair)', fontSize: '64px', fontWeight: 900,
                  color: '#1a3a22', position: 'absolute', top: '16px', right: '20px', lineHeight: 1,
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

          {/* Earning rate visual */}
          <div data-reveal style={{
            background: 'linear-gradient(135deg, #0d2818, #1a3a22)',
            border: '1px solid #243d2a', borderRadius: '20px',
            padding: '48px', textAlign: 'center',
          }}>
            <p style={{ fontSize: '11px', letterSpacing: '4px', textTransform: 'uppercase', color: '#c4a265', marginBottom: '16px' }}>
              Earning Rate
            </p>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '56px', fontWeight: 700, color: '#fafafa' }}>R100</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px' }}>SPENT</div>
              </div>
              <div style={{ fontSize: '32px', color: '#1a3a22' }}>=</div>
              <div>
                <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '56px', fontWeight: 700, color: '#57cc99' }}>10</div>
                <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', letterSpacing: '2px' }}>KHULA BUCKS</div>
              </div>
            </div>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', marginTop: '16px' }}>
              That's <strong style={{ color: '#57cc99' }}>10% back</strong> on every rand you spend at Khula Cafe.
            </p>
          </div>
        </div>
      </section>

      {/* Khula Gold tier */}
      <section id="gold" style={{ padding: '100px 0', background: '#071a0e' }}>
        <div className="section-wrap">
          <div className="two-col-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '48px', alignItems: 'center' }}>
            <div>
              <p className="section-label" data-reveal>Premium Tier</p>
              <h2 data-reveal data-delay="100" style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, color: '#fafafa', marginBottom: '24px' }}>
                Khula Gold 🏅
              </h2>
              <p data-reveal data-delay="200" style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.9, marginBottom: '20px' }}>
                We believe in looking after our community. <strong style={{ color: '#c4a265' }}>Pensioners and students</strong> qualify for Khula Gold — a permanent discount tier that rewards loyalty and makes quality food accessible.
              </p>
              <div data-reveal data-delay="300" style={{
                background: '#0d2818', border: '1px solid #c4a26540',
                borderRadius: '14px', padding: '24px', marginBottom: '32px',
              }}>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <span style={{ fontSize: '24px' }}>💛</span>
                  <div>
                    <h4 style={{ color: '#c4a265', fontSize: '16px', marginBottom: '4px' }}>15% off every Tuesday</h4>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>Upload your ID or student card once in the app to unlock permanent Khula Gold status.</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <span style={{ fontSize: '24px' }}>📱</span>
                  <div>
                    <h4 style={{ color: '#c4a265', fontSize: '16px', marginBottom: '4px' }}>Verified once, active forever</h4>
                    <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>One photo upload is all it takes. No renewal, no complications.</p>
                  </div>
                </div>
              </div>
              <Link data-reveal data-delay="400" href="/contact" style={{
                textDecoration: 'none', fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase',
                fontWeight: 600, color: '#040d07', padding: '14px 40px', borderRadius: '50px',
                background: 'linear-gradient(135deg, #f5a623, #c4a265)',
                display: 'inline-block', boxShadow: '0 6px 20px rgba(196,162,101,0.35)',
              }}>
                Apply for Khula Gold
              </Link>
            </div>
            <div data-reveal="right" style={{
              background: 'linear-gradient(135deg, #2d1a0a 0%, #0d2818 100%)',
              border: '1px solid #c4a26530', borderRadius: '20px',
              padding: '48px', textAlign: 'center',
            }}>
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>🏅</div>
              <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '28px', color: '#c4a265', marginBottom: '8px' }}>Khula Gold</h3>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginBottom: '32px' }}>For pensioners & students</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['15% off every Tuesday', 'Priority WhatsApp support', 'Exclusive monthly deals', 'Early access to new menu items'].map((perk, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ color: '#57cc99', fontSize: '14px' }}>✓</span>
                    <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)' }}>{perk}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* App features */}
      <section style={{ padding: '100px 0', background: '#040d07' }}>
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
                background: '#0d2818', borderRadius: '16px', padding: '28px',
                borderLeft: `3px solid ${f.color}`,
                border: `1px solid ${f.color}20`, borderLeftWidth: '3px', borderLeftColor: f.color,
              }}>
                <div style={{ fontSize: '32px', marginBottom: '14px' }}>{f.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '18px', color: '#fafafa', marginBottom: '10px' }}>{f.title}</h3>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.75 }}>{f.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  )
}
