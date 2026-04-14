'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import { galleryImages } from '../../lib/mockData'

const fallbackGradients = [
  'linear-gradient(135deg, #1b5e20 0%, #0a2e12 60%, #040d07 100%)',
  'linear-gradient(135deg, #3e2723 0%, #1a0a00 60%, #040d07 100%)',
  'linear-gradient(135deg, #1a237e 0%, #0d1260 60%, #040d07 100%)',
  'linear-gradient(135deg, #004d40 0%, #001f1a 60%, #040d07 100%)',
  'linear-gradient(135deg, #1b5e20 0%, #2e7d32 50%, #1a3a22 100%)',
  'linear-gradient(135deg, #4a2c0a 0%, #2d1a06 60%, #040d07 100%)',
]

export default function GalleryPage() {
  useScrollReveal()
  const [lightbox, setLightbox] = useState(null)
  const [imgError, setImgError] = useState({})

  const handleImgError = (id) => setImgError(prev => ({ ...prev, [id]: true }))

  return (
    <>
      <div className="page-hero">
        <p className="section-label">Inside Khula</p>
        <h1 style={{ fontFamily: 'var(--font-playfair)' }}>Gallery</h1>
        <p>A glimpse into the world we've created for you.</p>
      </div>

      {/* Gallery grid */}
      <section style={{ padding: '80px 0', background: '#040d07' }}>
        <div className="section-wrap">
          <div className="gallery-grid">
            {galleryImages.map((img, i) => (
              <div
                key={img.id}
                data-reveal
                data-delay={`${(i % 3) * 120}`}
                onClick={() => setLightbox(img)}
                className={`card-lift${i === 0 ? ' gallery-card-wide' : ''}`}
                style={{
                  position: 'relative',
                  height: i === 0 || i === 3 ? '420px' : '320px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  background: fallbackGradients[i],
                  border: '1px solid #1a3a22',
                }}
              >
                {/* Real photo */}
                {!imgError[img.id] && (
                  <img
                    src={img.src}
                    alt={img.alt}
                    onError={() => handleImgError(img.id)}
                    style={{
                      position: 'absolute', inset: 0,
                      width: '100%', height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                )}

                {/* Gradient overlay — always present for readability */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(4,13,7,0.85) 0%, rgba(4,13,7,0.1) 50%, transparent 100%)',
                }} />

                {/* Hover overlay with expand hint */}
                <div
                  className="gallery-hover"
                  style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                    padding: '24px', opacity: 0, transition: 'opacity 0.3s',
                    background: 'rgba(4,13,7,0.3)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                >
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>Click to expand →</p>
                </div>

                {/* Caption badge */}
                <div style={{
                  position: 'absolute', bottom: '16px', left: '16px',
                  background: 'rgba(4,13,7,0.75)', backdropFilter: 'blur(8px)',
                  padding: '6px 12px', borderRadius: '20px',
                  fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#57cc99',
                }}>
                  {img.caption}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 2000,
            background: 'rgba(4,13,7,0.97)', backdropFilter: 'blur(20px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{
            maxWidth: '860px', width: '100%', borderRadius: '20px',
            overflow: 'hidden', border: '1px solid #1a3a22',
          }}>
            <div style={{
              height: '520px', position: 'relative',
              background: fallbackGradients[galleryImages.indexOf(lightbox)],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {!imgError[lightbox.id] && (
                <img
                  src={lightbox.src}
                  alt={lightbox.alt}
                  onError={() => handleImgError(lightbox.id)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                />
              )}
            </div>
            <div style={{
              background: '#0d2818', padding: '24px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '20px', color: '#fafafa' }}>{lightbox.caption}</p>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>Khula Cafe — Pinetown</p>
              </div>
              <button onClick={() => setLightbox(null)} style={{
                background: '#1a3a22', border: 'none', color: '#fafafa', cursor: 'pointer',
                width: '40px', height: '40px', borderRadius: '50%', fontSize: '18px',
              }}>×</button>
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <section style={{ padding: '80px 32px', textAlign: 'center', background: '#071a0e', borderTop: '1px solid #1a3a22' }}>
        <h2 data-reveal style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 700, color: '#fafafa', marginBottom: '16px' }}>
          Experience It In Person
        </h2>
        <p data-reveal data-delay="100" style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', maxWidth: '400px', margin: '0 auto 32px', lineHeight: 1.7 }}>
          Photos can only capture so much. Reserve your table and feel the Khula magic.
        </p>
        <Link data-reveal data-delay="200" href="/book" style={{
          textDecoration: 'none', fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase',
          fontWeight: 600, color: '#fff', padding: '14px 40px', borderRadius: '50px',
          background: 'linear-gradient(135deg, #2d6a4f, #40916c)',
          boxShadow: '0 6px 20px rgba(45,106,79,0.4)', display: 'inline-block',
        }}>
          Reserve a Table
        </Link>
      </section>
    </>
  )
}
