'use client'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useScrollReveal } from '../hooks/useScrollReveal'
import { stats, appFeatures, testimonials } from '../lib/mockData'
import { supabase } from '../lib/supabase-public'
import { useCart } from '../lib/cart-context'

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
    <div className="hero-light-rays" aria-hidden="true">
      {rays.map((r, i) => (
        <div key={i} style={{
          position: 'absolute',
          left: r.left, top: '-5%',
          width: '2px', height: '85%',
          background: 'linear-gradient(to bottom, rgba(255,220,80,0.95), transparent)',
          transformOrigin: 'top center',
          transform: `rotate(${r.angle})`,
          animation: `rayPulse ${r.dur} ease-in-out ${r.delay} infinite alternate`,
          pointerEvents: 'none',
        }} />
      ))}
    </div>
  )
}

export default function HomePage() {
  useScrollReveal()
  const { addItem, items } = useCart()
  function cartQty(itemId) { return items.find(i => i.id === itemId)?.qty ?? 0 }
  const [scrollY, setScrollY] = useState(0)
  const [featuredItems, setFeaturedItems] = useState([])
  const [atmosphereItems, setAtmosphereItems] = useState([])

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    Promise.all([
      supabase.from('menu_items').select('*').eq('is_featured', true).order('sort_order').limit(3),
      supabase.from('gallery_items').select('*').eq('is_atmosphere', true).order('sort_order').limit(6),
    ]).then(([{ data: featured }, { data: atmosphere }]) => {
      if (featured) setFeaturedItems(featured)
      if (atmosphere) setAtmosphereItems(atmosphere)
    })
  }, [])

  return (
    <>
      {/* ═══ HERO ══════════════════════════════════════════════════════════ */}
      <section style={{
        position: 'relative', minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        overflow: 'hidden',
        background: 'linear-gradient(105deg, #7d5a0b 0%, #c8940c 18%, #f5c842 38%, #f0d96a 50%, #f5c842 66%, #c8940c 82%, #7d5a0b 100%)',
        backgroundSize: '160% 100%',
        animation: 'heroGlow 8s ease-in-out infinite',
      }}>
        <LightRays />

        {/* Parallax overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 60% 25%, rgba(255,251,224,0.25) 0%, transparent 55%)',
          transform: `translateY(${scrollY * 0.25}px)`,
          pointerEvents: 'none',
        }} />

        {/* Bottom gold strip */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, #3d2200 25%, #0a0600 50%, #3d2200 75%, transparent 100%)',
          boxShadow: '0 0 20px rgba(61,34,0,0.5)',
        }} />

        {/* Hero content */}
        <div style={{
          position: 'relative', zIndex: 10, textAlign: 'center',
          padding: '0 24px', maxWidth: '900px',
          transform: `translateY(${scrollY * 0.18}px)`,
        }}>
          <img
            src="/images/logo.png"
            alt="Khula Cafe"
            style={{
              width: 'clamp(160px, 22vw, 260px)',
              height: 'auto',
              display: 'block',
              margin: '0 auto 8px',
              filter: 'drop-shadow(0 8px 32px rgba(61,34,0,0.35))',
            }}
          />

          <p style={{
            fontSize: 'clamp(15px, 2.5vw, 20px)', color: 'rgba(0,0,0,0.65)',
            maxWidth: '560px', margin: '0 auto 48px', lineHeight: 1.8,
          }}>
            Where memories are made, smiles are created, and every great conversation begins over a perfect cup of coffee.
          </p>

          {/* CTAs */}
          <div className="cta-row" style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/book" style={{
              textDecoration: 'none', fontSize: '12px', letterSpacing: '3px',
              textTransform: 'uppercase', fontWeight: 600, color: '#f5c842',
              padding: '16px 40px', borderRadius: '50px',
              background: '#0a0600',
              boxShadow: '0 6px 24px rgba(10,6,0,0.4)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(10,6,0,0.55)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 6px 24px rgba(10,6,0,0.4)' }}
            >
              Reserve a Table
            </Link>
            <Link href="/menu" style={{
              textDecoration: 'none', fontSize: '12px', letterSpacing: '3px',
              textTransform: 'uppercase', fontWeight: 600, color: '#0a0600',
              padding: '16px 40px', borderRadius: '50px',
              border: '1px solid rgba(61,34,0,0.5)',
              background: 'rgba(61,34,0,0.08)',
              transition: 'background 0.2s, border-color 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(61,34,0,0.18)'; e.currentTarget.style.borderColor = '#3d2200' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(61,34,0,0.08)'; e.currentTarget.style.borderColor = 'rgba(61,34,0,0.5)' }}
            >
              View Menu
            </Link>
          </div>

          {/* Scroll indicator */}
          <div style={{ marginTop: '72px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '9px', letterSpacing: '4px', textTransform: 'uppercase', color: 'rgba(0,0,0,0.4)' }}>Scroll</span>
            <div style={{
              width: '1px', height: '50px',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.35), transparent)',
              animation: 'floatY 2s ease-in-out infinite',
            }} />
          </div>
        </div>
      </section>

      {/* ═══ STATS BAR ═════════════════════════════════════════════════════ */}
      <section style={{ background: '#140e00', borderTop: '1px solid #2e2000', borderBottom: '1px solid #2e2000', padding: '48px 0' }}>
        <div className="section-wrap">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '32px', textAlign: 'center' }}>
            {stats.map((stat, i) => (
              <div key={i} data-reveal data-delay={`${i * 100 + 100}`} style={{ padding: '16px' }}>
                <div style={{
                  fontFamily: 'var(--font-playfair)', fontSize: 'clamp(36px, 5vw, 52px)',
                  fontWeight: 700, color: '#f5c842', lineHeight: 1,
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
      <section style={{ padding: '100px 0', background: '#0a0600' }}>
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

          {featuredItems.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', marginBottom: '48px' }}>
            {featuredItems.map((item, i) => (
              <div key={item.id} className="card-lift" data-reveal data-delay={`${i * 150 + 200}`} style={{
                background: '#1e1500', border: '1px solid #2e2000', borderRadius: '16px',
                overflow: 'hidden', position: 'relative',
                display: 'flex', flexDirection: 'column',
              }}>
                {item.image_url ? (
                  <div style={{ position: 'relative', height: '180px', flexShrink: 0 }}>
                    <img src={item.image_url} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(30,21,0,0.65) 0%, transparent 60%)' }} />
                    {item.badge && (
                      <span style={{
                        position: 'absolute', top: '14px', right: '14px',
                        background: '#f5c842', color: '#0a0600',
                        fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase',
                        padding: '4px 10px', borderRadius: '20px',
                      }}>{item.badge}</span>
                    )}
                  </div>
                ) : (
                  <div style={{ padding: '28px 28px 0' }}>
                    <div style={{ fontSize: '36px', marginBottom: '8px' }}>
                      {i === 0 ? '🥩' : i === 1 ? '🍛' : '🍔'}
                    </div>
                  </div>
                )}
                <div style={{ padding: '20px 28px 28px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  {!item.image_url && item.badge && (
                    <span style={{
                      alignSelf: 'flex-start', marginBottom: '10px',
                      background: '#f5c842', color: '#0a0600',
                      fontSize: '9px', fontWeight: 700, letterSpacing: '1.5px', textTransform: 'uppercase',
                      padding: '4px 10px', borderRadius: '20px',
                    }}>{item.badge}</span>
                  )}
                  <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '20px', color: '#fafafa', marginBottom: '8px' }}>
                    {item.name}
                  </h3>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: '20px', flex: 1 }}>
                    {item.description}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '22px', color: '#f5c842', fontWeight: 600 }}>
                      {item.price}
                    </span>
                    {item.price_cents ? (
                      <button
                        onClick={() => addItem({ id: item.id, name: item.name, price_cents: item.price_cents, image_url: item.image_url || null })}
                        style={{
                          fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 700,
                          color: '#0a0600', padding: '7px 16px', borderRadius: '30px', border: 'none', cursor: 'pointer',
                          background: cartQty(item.id) > 0 ? 'linear-gradient(135deg, #c8940c, #a07008)' : 'linear-gradient(135deg, #f5c842, #c8940c)',
                        }}
                      >
                        {cartQty(item.id) > 0 ? `In Cart (${cartQty(item.id)})` : 'Add →'}
                      </button>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#c8940c', textTransform: 'uppercase', letterSpacing: '2px' }}>Order →</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          )}

          <div style={{ textAlign: 'center' }} data-reveal>
            <Link href="/menu" style={{
              textDecoration: 'none', fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase',
              fontWeight: 600, color: '#f5c842',
              padding: '14px 40px', borderRadius: '50px', border: '1px solid #c8940c',
              transition: 'all 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.background = '#c8940c'; e.currentTarget.style.color = '#0a0600' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#f5c842' }}
            >
              View Full Menu
            </Link>
          </div>
        </div>
      </section>

      {/* ═══ GALLERY GRID ═════════════════════════════════════════════════ */}
      <section style={{ padding: '80px 0', background: '#140e00' }}>
        <div className="section-wrap">
          <div style={{ marginBottom: '40px' }}>
            <p className="section-label" data-reveal>Inside Khula</p>
            <h2 data-reveal data-delay="100" style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 700, color: '#fafafa' }}>
              The Atmosphere
            </h2>
          </div>

          <div className="gallery-grid" style={{ marginBottom: '32px' }}>
            {(atmosphereItems.length > 0 ? atmosphereItems : [
              { id: 'p1', label: 'Dining Room', icon: '🌿', image_url: null },
              { id: 'p2', label: 'The Counter', icon: '☕', image_url: null },
              { id: 'p3', label: 'Lounge Area', icon: '🛋️', image_url: null },
              { id: 'p4', label: 'Evening Glow', icon: '✨', image_url: null },
              { id: 'p5', label: 'The Lounge', icon: '💛', image_url: null },
              { id: 'p6', label: 'Pastry Display', icon: '🍰', image_url: null },
            ]).map((item, i) => (
              <Link key={item.id} href="/gallery"
                className={i === 0 ? 'gallery-card-wide' : ''}
                style={{
                  textDecoration: 'none',
                  position: 'relative',
                  height: i === 0 || i === 3 ? '400px' : '300px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: 'linear-gradient(135deg, #3d2200 0%, #140e00 100%)',
                  border: '1px solid #2e2000',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'transform 0.35s ease, box-shadow 0.35s ease',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 16px 40px rgba(0,0,0,0.5)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
              >
                {item.image_url && (
                  <img src={item.image_url} alt={item.label} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                )}
                {!item.image_url && <div style={{ fontSize: '56px', opacity: 0.45 }}>{item.icon}</div>}

                <div className="gallery-overlay" style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(10,6,0,0.88) 0%, rgba(10,6,0,0.15) 55%, transparent 100%)',
                  display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                  padding: '24px', opacity: 0, transition: 'opacity 0.3s',
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                >
                  <p style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: '#f5c842', marginBottom: '4px' }}>View Gallery</p>
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)' }}>Click to explore →</p>
                </div>

                <div style={{
                  position: 'absolute', bottom: '16px', left: '16px',
                  background: 'rgba(10,6,0,0.8)', backdropFilter: 'blur(8px)',
                  padding: '6px 14px', borderRadius: '20px',
                  fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#f5c842',
                }}>
                  {item.label}
                </div>
              </Link>
            ))}
          </div>

          <Link href="/gallery" style={{
            textDecoration: 'none', fontSize: '12px', letterSpacing: '2px',
            textTransform: 'uppercase', color: '#f5c842', display: 'inline-flex', alignItems: 'center', gap: '6px',
          }}>
            View Full Gallery →
          </Link>
        </div>
      </section>

      {/* ═══ APP FEATURES ══════════════════════════════════════════════════ */}
      <section style={{ padding: '100px 0', background: '#0a0600' }}>
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
                background: 'linear-gradient(160deg, #2a1c00 0%, #1e1500 60%, #140e00 100%)',
                border: '1px solid #2e2000',
                borderRadius: '16px', padding: '28px',
                position: 'relative', overflow: 'hidden',
              }}>
                {/* Gold top accent line */}
                <div style={{
                  position: 'absolute', top: 0, left: '28px', right: '28px', height: '2px',
                  background: 'linear-gradient(90deg, transparent, #f5c842, transparent)',
                }} />
                {/* Icon box */}
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: 'rgba(245,200,66,0.1)', border: '1px solid rgba(245,200,66,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '22px', marginBottom: '18px',
                }}>{feat.icon}</div>
                <h3 style={{ fontFamily: 'var(--font-playfair)', fontSize: '18px', color: '#fafafa', marginBottom: '10px' }}>
                  {feat.title}
                </h3>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.75, margin: 0 }}>
                  {feat.description}
                </p>
                {/* Subtle corner glow */}
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

      {/* ═══ TESTIMONIALS ══════════════════════════════════════════════════ */}
      <section style={{ padding: '100px 0', background: '#140e00' }}>
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
                background: '#1e1500', border: '1px solid #2e2000', borderRadius: '16px',
                padding: '32px', position: 'relative',
              }}>
                <div style={{
                  fontFamily: 'var(--font-playfair)', fontSize: '80px', lineHeight: 0.7,
                  color: '#2e2000', position: 'absolute', top: '20px', left: '24px',
                  fontWeight: 900,
                }}>"</div>
                <div style={{ display: 'flex', gap: '4px', marginBottom: '16px' }}>
                  {Array(t.rating).fill(0).map((_, j) => (
                    <span key={j} style={{ color: '#f5c842', fontSize: '14px' }}>★</span>
                  ))}
                </div>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.75)', lineHeight: 1.8, marginBottom: '24px', fontStyle: 'italic' }}>
                  "{t.comment}"
                </p>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: '#fafafa' }}>{t.name}</div>
                    <div style={{ fontSize: '11px', color: '#f5c842', letterSpacing: '1px' }}>{t.occasion}</div>
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
        background: 'linear-gradient(105deg, #7d5a0b 0%, #c8940c 18%, #f5c842 38%, #fffbe0 52%, #f5c842 66%, #c8940c 82%, #7d5a0b 100%)',
        position: 'relative', overflow: 'hidden', textAlign: 'center',
      }}>
        {/* Top dark strip */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, transparent, #3d2200, #0a0600, #3d2200, transparent)',
        }} />
        <LightRays />

        <div style={{ position: 'relative', zIndex: 10 }}>
          <p className="section-label" data-reveal style={{ color: '#3d2200' }}>Make It Unforgettable</p>
          <h2 data-reveal data-delay="100" style={{
            fontFamily: 'var(--font-playfair)', fontSize: 'clamp(32px, 6vw, 64px)',
            fontWeight: 700, color: '#0a0600', maxWidth: '700px', margin: '0 auto 24px', lineHeight: 1.2,
          }}>
            Reserve Your Perfect Evening
          </h2>
          <p data-reveal data-delay="200" style={{
            fontSize: '16px', color: 'rgba(0,0,0,0.6)',
            maxWidth: '480px', margin: '0 auto 48px', lineHeight: 1.8,
          }}>
            A R100 deposit secures your table. We handle the rest — flowers, songs, centerpieces, and smiles.
          </p>
          <div data-reveal data-delay="300" style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/book" style={{
              textDecoration: 'none', fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase',
              fontWeight: 700, color: '#f5c842',
              padding: '18px 48px', borderRadius: '50px',
              background: '#0a0600',
              boxShadow: '0 8px 30px rgba(10,6,0,0.35)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none' }}
            >
              Book Now
            </Link>
            <Link href="/menu" style={{
              textDecoration: 'none', fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase',
              fontWeight: 600, color: '#0a0600',
              padding: '18px 48px', borderRadius: '50px',
              border: '1px solid rgba(61,34,0,0.4)',
              background: 'rgba(61,34,0,0.08)',
            }}>
              Explore Menu
            </Link>
          </div>
        </div>

        {/* Bottom dark strip */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px',
          background: 'linear-gradient(90deg, transparent, #3d2200, #0a0600, #3d2200, transparent)',
        }} />
      </section>
    </>
  )
}
