'use client'
import Link from 'next/link'
import { useScrollReveal } from '../../hooks/useScrollReveal'

export default function AboutPage() {
  useScrollReveal()

  const values = [
    { icon: '💚', title: 'People First', text: 'Every guest is family. We learn your name, remember your order, and make your day brighter.' },
    { icon: '🌿', title: 'Authentically SA', text: 'Our menu, our music, our soul — rooted in South African culture and hospitality.' },
    { icon: '✨', title: 'Every Moment Counts', text: 'From a quick coffee to a marriage proposal — we treat every visit as the most important one.' },
    { icon: '🤝', title: 'Community', text: 'Big business ideas and life-changing decisions are born over a Khula cup. We are proud to be that table.' },
  ]

  return (
    <>
      <div className="page-hero">
        <p className="section-label">Our Story</p>
        <h1 style={{ fontFamily: 'var(--font-playfair)' }}>About Khula Cafe</h1>
        <p>More than a cafe — a destination for people, memories, and connection.</p>
      </div>

      {/* Story section */}
      <section style={{ padding: '100px 0', background: '#040d07' }}>
        <div className="section-wrap">
          <div className="two-col-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '64px', alignItems: 'center' }}>
            <div>
              <p className="section-label" data-reveal>Who We Are</p>
              <h2 data-reveal data-delay="100" style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, color: '#fafafa', marginBottom: '24px', lineHeight: 1.2 }}>
                A Phygital Experience Like No Other
              </h2>
              <p data-reveal data-delay="200" style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.9, marginBottom: '20px' }}>
                Khula Cafe was born from a simple belief: that great food, beautiful spaces, and warm hospitality can change a person's day — and sometimes, their life.
              </p>
              <p data-reveal data-delay="300" style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.9, marginBottom: '20px' }}>
                We blend traditional South African hospitality with high-tech automation — creating what we call a <strong style={{ color: '#57cc99' }}>Phygital</strong> experience. Physical warmth, digital intelligence. A space that feels both modern and deeply personal.
              </p>
              <p data-reveal data-delay="400" style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.9, marginBottom: '40px' }}>
                Whether you're celebrating a birthday, closing a business deal, or simply need a quiet corner to think — Khula Cafe is your place.
              </p>
              <Link data-reveal data-delay="500" href="/book" style={{
                textDecoration: 'none', fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase',
                fontWeight: 600, color: '#fff', padding: '14px 40px', borderRadius: '50px',
                background: 'linear-gradient(135deg, #2d6a4f, #40916c)',
                boxShadow: '0 6px 20px rgba(45,106,79,0.4)', display: 'inline-block',
              }}>
                Reserve a Table
              </Link>
            </div>

            {/* Visual placeholder — replace with an actual image */}
            <div data-reveal="right" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                height: '260px', borderRadius: '16px',
                background: 'linear-gradient(135deg, #1b5e20 0%, #0a2e12 100%)',
                border: '1px solid #1a3a22',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '60px',
              }}>🌿</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{
                  height: '140px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #2d1a0a 0%, #1a0a00 100%)',
                  border: '1px solid #1a3a22',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px',
                }}>☕</div>
                <div style={{
                  height: '140px', borderRadius: '12px',
                  background: 'linear-gradient(135deg, #1a1a2e 0%, #0d0d20 100%)',
                  border: '1px solid #1a3a22',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px',
                }}>🛋️</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section style={{ padding: '100px 0', background: '#071a0e' }}>
        <div className="section-wrap">
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <p className="section-label" data-reveal>What Drives Us</p>
            <h2 data-reveal data-delay="100" style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, color: '#fafafa' }}>
              Our Values
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
            {values.map((v, i) => (
              <div key={i} className="card-lift" data-reveal data-delay={`${i * 100 + 100}`} style={{
                background: '#0d2818', border: '1px solid #1a3a22', borderRadius: '16px', padding: '32px',
              }}>
                <div style={{ fontSize: '36px', marginBottom: '16px' }}>{v.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '20px', color: '#fafafa', marginBottom: '12px' }}>{v.title}</h3>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* The Khula philosophy quote */}
      <section style={{
        padding: '100px 32px', textAlign: 'center',
        background: 'radial-gradient(ellipse at 50% 50%, #1b5e2022 0%, transparent 70%), #040d07',
        borderTop: '1px solid #1a3a22', borderBottom: '1px solid #1a3a22',
      }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '80px', color: '#1a3a22', lineHeight: 0.6, marginBottom: '24px' }} data-reveal>"</div>
          <blockquote data-reveal data-delay="100" style={{
            fontFamily: 'var(--font-playfair)', fontSize: 'clamp(20px, 3.5vw, 32px)',
            fontStyle: 'italic', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6,
          }}>
            The Khula Cafe experience is about people — making them feel special and valued, creating smiles, memories to last a lifetime, bringing people together, be it family, friends or business associates.
          </blockquote>
          <p data-reveal data-delay="200" style={{ marginTop: '32px', fontSize: '13px', letterSpacing: '3px', textTransform: 'uppercase', color: '#c4a265' }}>
            — The Khula Cafe Vision
          </p>
        </div>
      </section>
    </>
  )
}
