'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import { getAboutImages } from '../admin/actions'

export default function AboutPage() {
  useScrollReveal()
  const [photos, setPhotos] = useState({})
  useEffect(() => { getAboutImages().then(setPhotos) }, [])

  const values = [
    { icon: '💛', title: 'People First', text: 'Every guest is family. We learn your name, remember your order, and make your day brighter.' },
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
      <section style={{ padding: '100px 0', background: '#0a0600' }}>
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
                We blend traditional South African hospitality with high-tech automation — creating what we call a <strong style={{ color: '#f5c842' }}>Phygital</strong> experience. Physical warmth, digital intelligence. A space that feels both modern and deeply personal.
              </p>
              <p data-reveal data-delay="400" style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.9, marginBottom: '40px' }}>
                Whether you're celebrating a birthday, closing a business deal, or simply need a quiet corner to think — Khula Cafe is your place.
              </p>
              <Link data-reveal data-delay="500" href="/book" style={{
                textDecoration: 'none', fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase',
                fontWeight: 600, color: '#0a0600', padding: '14px 40px', borderRadius: '50px',
                background: 'linear-gradient(135deg, #f5c842, #c8940c)',
                boxShadow: '0 6px 20px rgba(200,148,12,0.4)', display: 'inline-block',
              }}>
                Reserve a Table
              </Link>
            </div>

            <div data-reveal="right" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{
                height: '260px', borderRadius: '16px', overflow: 'hidden',
                background: 'linear-gradient(135deg, #7d5a0b 0%, #3d2200 100%)',
                border: '1px solid #2e2000',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '60px',
              }}>
                {photos.main
                  ? <img src={photos.main} alt="Khula Cafe" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : '🌿'}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div style={{
                  height: '140px', borderRadius: '12px', overflow: 'hidden',
                  background: 'linear-gradient(135deg, #2d1a0a 0%, #1a0a00 100%)',
                  border: '1px solid #2e2000',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px',
                }}>
                  {photos.bottom_left
                    ? <img src={photos.bottom_left} alt="Khula Cafe" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : '☕'}
                </div>
                <div style={{
                  height: '140px', borderRadius: '12px', overflow: 'hidden',
                  background: 'linear-gradient(135deg, #1e1500 0%, #0a0600 100%)',
                  border: '1px solid #2e2000',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px',
                }}>
                  {photos.bottom_right
                    ? <img src={photos.bottom_right} alt="Khula Cafe" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : '🛋️'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section style={{ padding: '100px 0', background: '#140e00' }}>
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
                background: '#1e1500', border: '1px solid #2e2000', borderRadius: '16px', padding: '32px',
              }}>
                <div style={{ fontSize: '36px', marginBottom: '16px' }}>{v.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '20px', color: '#fafafa', marginBottom: '12px' }}>{v.title}</h3>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.8 }}>{v.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quote */}
      <section style={{
        padding: '100px 32px', textAlign: 'center',
        background: '#0a0600',
        borderTop: '1px solid #2e2000', borderBottom: '1px solid #2e2000',
      }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <div style={{ fontFamily: 'var(--font-playfair)', fontSize: '80px', color: '#2e2000', lineHeight: 0.6, marginBottom: '24px' }} data-reveal>"</div>
          <blockquote data-reveal data-delay="100" style={{
            fontFamily: 'var(--font-playfair)', fontSize: 'clamp(20px, 3.5vw, 32px)',
            fontStyle: 'italic', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6,
          }}>
            The Khula Cafe experience is about people — making them feel special and valued, creating smiles, memories to last a lifetime, bringing people together, be it family, friends or business associates.
          </blockquote>
          <p data-reveal data-delay="200" style={{ marginTop: '32px', fontSize: '13px', letterSpacing: '3px', textTransform: 'uppercase', color: '#f5c842' }}>
            — The Khula Cafe Vision
          </p>
        </div>
      </section>
    </>
  )
}
