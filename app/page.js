'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { stats, appFeatures, testimonials, menuCategories } from '../lib/mockData'

// ── Animated counter ──────────────────────────────────────────────────────────
function Counter({ target, suffix }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started.current) {
        started.current = true
        const isFloat = !Number.isInteger(target)
        const duration = 1800
        const steps = 60
        const inc = target / steps
        let current = 0
        const timer = setInterval(() => {
          current += inc
          if (current >= target) { setVal(target); clearInterval(timer) }
          else setVal(isFloat ? parseFloat(current.toFixed(1)) : Math.floor(current))
        }, duration / steps)
      }
    }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])

  return <span ref={ref}>{val}{suffix}</span>
}

// ── Light rays (hero background) ─────────────────────────────────────────────
function LightRays() {
  const rays = [
    { left: '8%',  angle: '-12deg', delay: '0s',    dur: '4s' },
    { left: '18%', angle: '-6deg',  delay: '0.8s',  dur: '5s' },
    { left: '28%', angle: '-2deg',  delay: '0.3s',  dur: '3.5s' },
    { left: '42%', angle: '3deg',   delay: '1.2s',  dur: '4.5s' },
    { left: '54%', angle: '7deg',   delay: '0.6s',  dur: '5.5s' },
    { left: '65%', angle: '12deg',  delay: '0.1s',  dur: '4s' },
    { left: '76%', angle: '16deg',  delay: '1s',    dur: '3.8s' },
    { left: '87%', angle: '20deg',  delay: '0.5s',  dur: '4.2s' },
  ]
  return (
    <>
      {rays.map((r, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: r.left, top: '-5%',
          width: '1.5px', height: '75%',
          background: 'linear-gradient(to bottom, rgba(180,255,200,0.9), transparent)',
          transformOrigin: 'top center',
          transform: `rotate(${r.angle})`,
          animation: `rayPulse ${r.dur} ease-in-out ${r.delay} infinite alternate`,
          pointerEvents: 'none',
        }} />
      ))}
    </>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  useScrollReveal()
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const featuredItems = [
    menuCategories[0].items[0],  // T-Bone Steak
    menuCategories[1].items[0],  // Mutton Bunny
    menuCategories[2].items[0],  // Khula King
  ]

  return (
    <>
      {/* ═══ HERO ══════════════════════════════════════════════════════════ */}
      <section style={{
        position: 'relative', minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        background: 'radial-gradient(ellipse at 62% 28%, #1b5e20 0%, #0a2e12 38%, #030c06 100%)',
      }}>
        <LightRays />

        {/* Parallax bg overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 60% 25%, rgba(27,94,32,0.35) 0%, transparent 55%)',
          transform: `translateY(${scrollY * 0.25}px)`,
          pointerEvents: 'none',
        }} />

        {/* Bottom neon LED strip */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, #39ff14 25%, #57cc99 50%, #39ff14 75%, transparent 100%)',
          boxShadow: '0 0 20px rgba(57,255,20,0.5), 0 0 50px rgba(57,255,20,0.25)',
        }} />

        {/* Hero content */}
        <div style={{
          position: 'relative', zIndex: 10, textAlign: 'center',
          padding: '0 24px', maxWidth: '900px',
          transform: `translateY(${scrollY * 0.18}px)`,
        }}>
          <p style={{ fontSize: '11px', letterSpacing: '6px', textTransform: 'uppercase', color: '#c4a265', marginBottom: '20px' }}>
            Welcome to
          </p>

          {/* Decorative oval frame */}
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: '8px' }}>
            {/* SVG arc frame */}
            <svg
              viewBox="0 0 500 420"
              style={{
                position: 'absolute',
                top: '50%', left: '50%',
                transform: 'translate(-50%, -46%)',
                width: 'clamp(340px, 60vw, 600px)',
                height: 'auto',
                pointerEvents: 'none',
                zIndex: -1,
              }}
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M 20 10 Q 0 220 250 400 Q 500 220 480 10"
                stroke="#c4a265" strokeWidth="1"
                strokeLinecap="round" opacity="0.3"
              />
            </svg>

            <h1 style={{
              position: 'relative', zIndex: 1,
              fontFamily: 'var(--font-playfair)', fontSize: 'clamp(60px, 12vw, 120px)',
              fontWeight: 900, lineHeight: 0.9, letterSpacing: '4px', color: '#fafafa',
              marginBottom: '16px',
            }}>
              KHULA
              <br />
              <span style={{
                color: '#57cc99',
                textShadow: '0 0 40px rgba(87,204,153,0.5), 0 0 80px rgba(87,204,153,0.2)',
              }}>
                CAFE
              </span>
            </h1>
          </div>

          {/* Gold divider */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px', margin: '24px 0' }}>
            <div style={{ height: '1px', width: '60px', background: 'linear-gradient(90deg, transparent, #c4a265)' }} />
            <p style={{ fontSize: '9px', letterSpacing: '6px', textTransform: 'uppercase', color: '#c4a265' }}>
              Best of the Best
            </p>
            <div style={{ height: '1px', width: '60px', background: 'linear-gradient(90deg, #c4a265, transparent)' }} />
          </div>

          <p style={{
            fontSize: 'clamp(15px, 2.5vw, 20px)', color: 'rgba(255,255,255,0.7)',
            maxWidth: '560px', margin: '0 auto 48px', lineHeight: 1.8,
          }}>
            Where memories are made, smiles are created, and every great conversation begins over a perfect cup of coffee.
          </p>

          {/* CTAs */}
          <div className="cta-row" style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/book" style={{
              textDecoration: 'none', fontSize: '12px', letterSpacing: '3px',
              textTransform: 'uppercase', fontWeight: 600, color: '#fff',
              padding: '16px 40px', borderRadius: '50px',
              background: 'linear-gradient(135deg, #2d6a4f, #40916c)',
              boxShadow: '0 6px 24px rgba(45,106,79,0.5)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(45,106,79,0.65)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(45,106,79,0.5)' }}
            >
              Reserve a Table
            </Link>
            <Link href="/menu" style={{
              textDecoration: 'none', fontSize: '12px', letterSpacing: '3px',
              textTransform: 'uppercase', fontWeight: 600, color: '#fafafa',
              padding: '16px 40px', borderRadius: '50px',
              border: '1px solid rgba(196,162,101,0.5)',
              background: 'rgba(196,162,101,0.05)',
              transition: 'background 0.2s, border-color 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(196,162,101,0.12)'; e.currentTarget.style.borderColor = '#c4a265' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(196,162,101,0.05)'; e.currentTarget.style.borderColor = 'rgba(196,162,101,0.5)' }}
            >
              View Menu
            </Link>
          </div>

          {/* Scroll indicator */}
          <div style={{ marginTop: '72px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '9px', letterSpacing: '4px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>Scroll</span>
            <div style={{
              width: '1px', height: '50px',
              background: 'linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)',
              animation: 'floatY 2s ease-in-out infinite',
            }} />
          </div>
        </div>
      </section>

      {/* ═══ STATS BAR ═════════════════════════════════════════════════════ */}
      <section style={{ background: '#0d2818', borderTop: '1px solid #1a3a22', borderBottom: '1px solid #1a3a22', padding: '48px 0' }}>
        <div className="section-wrap">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '32px', textAlign: 'center' }}>
            {stats.map((stat, i) => (
              <div key={i} data-reveal data-delay={`${i * 100 + 100}`} style={{ padding: '16px' }}>
                <div style={{
                  fontFamily: 'var(--font-playfair)', fontSize: 'clamp(36px, 5vw, 52px)',
                  fontWeight: 700, color: '#57cc99', lineHeight: 1,
                }}>
                  <Counter target={stat.value} suffix={stat.suffix} />
                </div>
                <div style={{ fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginTop: '8px' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURED MENU ════════════════════════════════════════════════ */}
      <section style={{ padding: '100px 0', background: '#040d07' }}>
        <div className="section-wrap">
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <p className="section-label" data-reveal data-delay="100">A Taste of South Africa</p>
            <h2 data-reveal data-delay="200" style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(32px, 5vw, 56px)', fontWeight: 700, color: '#fafafa', marginBottom: '16px' }}>
              Khula Favourites
            </h2>
            <p data-reveal data-delay="300" style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
              From flame-grilled meats to bunny chows — every dish tells a South African story.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '48px' }}>
            {featuredItems.map((item, i) => (
              <div key={item.id} className="card-lift" data-reveal data-delay={`${i * 150 + 200}`} style={{
                background: '#0d2818', border: '1px solid #1a3a22', borderRadius: '16px',
                padding: '28px', position: 'relative', overflow: 'hidden', cursor: 'pointer',
              }}>
                {/* shimmer overlay */}
                <div className="shimmer" style={{ position: 'absolute', inset: 0, borderRadius: '16px', pointerEvents: 'none' }} />
                {item.badge && (
                  <span style={{
                    position: 'absolute', top: '20px', right: '20px',
                    background: '#c4a265', color: '#040d07',
                    fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase',
                    padding: '4px 10px', borderRadius: '20px',
                  }}>{item.badge}</span>
                )}
                <div style={{ fontSize: '36px', marginBottom: '16px' }}>
                  {i === 0 ? '🥩' : i === 1 ? '🍛' : '🍔'}
                </div>
                <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '20px', color: '#fafafa', marginBottom: '8px' }}>
                  {item.name}
                </h3>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: '20px' }}>
                  {item.description}
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '22px', color: '#c4a265', fontWeight: 600 }}>
                    {item.price}
                  </span>
                  <span style={{ fontSize: '11px', letterSpacing: '2px', color: '#57cc99', textTransform: 'uppercase' }}>
                    Order →
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ textAlign: 'center' }} data-reveal>
            <Link href="/menu" style={{
              textDecoration: 'none', fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase',
              fontWeight: 600, color: '#57cc99',
              padding: '14px 40px', borderRadius: '50px', border: '1px solid #2d6a4f',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#2d6a4f'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#57cc99' }}
            >
              View Full Menu
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ GALLERY GRID ═════════════════════════════════════════════════ */}
      <section style={{ padding: '80px 0', background: '#071a0e' }}>
        <div className="section-wrap">
          <div style={{ marginBottom: '40px' }}>
            <p className="section-label" data-reveal>Inside Khula</p>
            <h2 data-reveal data-delay="100" style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, color: '#fafafa' }}>
              The Atmosphere
            </h2>
          </div>

          {(() => {
            const items = [
              { bg: 'linear-gradient(135deg, #1a3a22 0%, #071a0e 100%)', label: 'Dining Room', icon: '🌿' },
              { bg: 'linear-gradient(135deg, #2d1a0a 0%, #1a0a00 100%)', label: 'The Counter', icon: '☕' },
              { bg: 'linear-gradient(135deg, #1a1a2e 0%, #0d0d1a 100%)', label: 'Lounge Area', icon: '🛋️' },
              { bg: 'linear-gradient(135deg, #0d2818 0%, #040d07 100%)', label: 'Evening Glow', icon: '✨' },
              { bg: 'linear-gradient(135deg, #1a2e1a 0%, #0a1a0a 100%)', label: 'The Lounge', icon: '💚' },
              { bg: 'linear-gradient(135deg, #2e1a0a 0%, #1a0d00 100%)', label: 'Pastry Display', icon: '🍰' },
            ]
            return (
              <div className="gallery-grid" style={{ marginBottom: '32px' }}>
                {items.map((item, i) => (
                  <Link key={i} href="/gallery" data-reveal data-delay={`${(i % 3) * 100}`}
                    className={i === 0 ? 'gallery-card-wide' : ''}
                    style={{
                    textDecoration: 'none',
                    position: 'relative',
                    height: i === 0 || i === 3 ? '400px' : '300px',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    background: item.bg,
                    border: '1px solid #1a3a22',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                    transition: 'transform 0.35s ease, box-shadow 0.35s ease',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.5)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <div style={{ fontSize: '56px', opacity: 0.45 }}>{item.icon}</div>

                    {/* Hover overlay */}
                    <div className="gallery-overlay" style={{
                      position: 'absolute', inset: 0,
                      background: 'linear-gradient(to top, rgba(4,13,7,0.88) 0%, rgba(4,13,7,0.15) 55%, transparent 100%)',
                      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                      padding: '24px', opacity: 0, transition: 'opacity 0.3s',
                    }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                    >
                      <p style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: '#57cc99', marginBottom: '4px' }}>
                        View Gallery
                      </p>
                      <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)' }}>Click to explore →</p>
                    </div>

                    {/* Caption badge */}
                    <div style={{
                      position: 'absolute', bottom: '16px', left: '16px',
                      background: 'rgba(4,13,7,0.8)', backdropFilter: 'blur(8px)',
                      padding: '6px 14px', borderRadius: '20px',
                      fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#57cc99',
                    }}>
                      {item.label}
                    </div>
                  </Link>
                ))}
              </div>
            )
          })()}

          <Link href="/gallery" style={{
            textDecoration: 'none', fontSize: '12px', letterSpacing: '2px',
            textTransform: 'uppercase', color: '#57cc99', display: 'inline-flex', alignItems: 'center', gap: '6px',
          }}>
            View Full Gallery →
          </Link>
        </div>
      </section>

      {/* ═══ APP FEATURES ══════════════════════════════════════════════════ */}
      <section style={{ padding: '100px 0', background: '#071a0e' }}>
        <div className="section-wrap">
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <p className="section-label" data-reveal>The Khula Connect App</p>
            <h2 data-reveal data-delay="100" style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(30px, 5vw, 52px)', fontWeight: 700, color: '#fafafa', marginBottom: '16px' }}>
              A Smarter Way to Dine
            </h2>
            <p data-reveal data-delay="200" style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', maxWidth: '500px', margin: '0 auto', lineHeight: 1.7 }}>
              We blend physical hospitality with digital intelligence — a true Phygital experience.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {appFeatures.map((feat, i) => (
              <div key={i} className="card-lift" data-reveal data-delay={`${i * 100 + 100}`} style={{
                background: '#0d2818', border: `1px solid ${feat.color}22`,
                borderRadius: '16px', padding: '28px',
                borderLeft: `3px solid ${feat.color}`,
              }}>
                <div style={{ fontSize: '32px', marginBottom: '16px' }}>{feat.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '18px', color: '#fafafa', marginBottom: '10px' }}>
                  {feat.title}
                </h3>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.75 }}>
                  {feat.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ══════════════════════════════════════════════════ */}
      <section style={{ padding: '100px 0', background: '#040d07' }}>
        <div className="section-wrap">
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <p className="section-label" data-reveal>What Our Guests Say</p>
            <h2 data-reveal data-delay="100" style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(28px, 4.5vw, 48px)', fontWeight: 700, color: '#fafafa' }}>
              Real Experiences
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px' }}>
            {testimonials.map((t, i) => (
              <div key={t.id} data-reveal data-delay={`${i * 150 + 100}`} style={{
                background: '#0d2818', border: '1px solid #1a3a22', borderRadius: '16px',
                padding: '32px', position: 'relative',
              }}>
                {/* Quote mark */}
                <div style={{
                  fontFamily: 'var(--font-playfair)', fontSize: '80px', lineHeight: 0.7,
                  color: '#1a3a22', position: 'absolute', top: '20px', left: '24px',
                  fontWeight: 900,
                }}>"</div>
                {/* Stars */}
                <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                  {Array(t.rating).fill(0).map((_, j) => (
                    <span key={j} style={{ color: '#f5a623', fontSize: '14px' }}>★</span>
                  ))}
                </div>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: '24px', fontStyle: 'italic' }}>
                  "{t.comment}"
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#fafafa' }}>{t.name}</div>
                    <div style={{ fontSize: '11px', color: '#57cc99', letterSpacing: '1px' }}>{t.occasion}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ BOOKING CTA BANNER ════════════════════════════════════════════ */}
      <section style={{
        padding: '120px 32px',
        background: 'radial-gradient(ellipse at 50% 50%, #1b5e20 0%, #0a2e12 50%, #030c06 100%)',
        position: 'relative', overflow: 'hidden', textAlign: 'center',
      }}>
        {/* Neon line top */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, transparent, #39ff14, #57cc99, #39ff14, transparent)',
          boxShadow: '0 0 20px rgba(57,255,20,0.4)',
        }} />
        <LightRays />

        <div style={{ position: 'relative', zIndex: 10 }}>
          <p className="section-label" data-reveal>Make It Unforgettable</p>
          <h2 data-reveal data-delay="100" style={{
            fontFamily: 'var(--font-playfair)', fontSize: 'clamp(32px, 6vw, 64px)',
            fontWeight: 700, color: '#fafafa', maxWidth: '700px', margin: '0 auto 24px', lineHeight: 1.2,
          }}>
            Reserve Your Perfect Evening
          </h2>
          <p data-reveal data-delay="200" style={{
            fontSize: '16px', color: 'rgba(255,255,255,0.65)',
            maxWidth: '480px', margin: '0 auto 48px', lineHeight: 1.8,
          }}>
            A R100 deposit secures your table. We handle the rest — flowers, songs, centerpieces, and smiles.
          </p>
          <div data-reveal data-delay="300" style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/book" style={{
              textDecoration: 'none', fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase',
              fontWeight: 700, color: '#040d07',
              padding: '18px 48px', borderRadius: '50px',
              background: 'linear-gradient(135deg, #57cc99, #2d6a4f)',
              boxShadow: '0 8px 30px rgba(87,204,153,0.4)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
            >
              Book Now
            </Link>
            <Link href="/menu" style={{
              textDecoration: 'none', fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase',
              fontWeight: 600, color: '#fff',
              padding: '18px 48px', borderRadius: '50px',
              border: '1px solid rgba(255,255,255,0.25)',
            }}>
              Explore Menu
            </Link>
          </div>
        </div>

        {/* Neon line bottom */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, transparent, #39ff14, #57cc99, #39ff14, transparent)',
          boxShadow: '0 0 20px rgba(57,255,20,0.4)',
        }} />
      </section>
    </>
  )
}
