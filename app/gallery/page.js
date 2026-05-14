'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useScrollReveal } from '../../hooks/useScrollReveal'
import { supabase } from '../../lib/supabase-public'

const fallbackGradients = [
  'linear-gradient(135deg, #7d5a0b 0%, #3d2200 60%, #0a0600 100%)',
  'linear-gradient(135deg, #5c3d00 0%, #2a1c00 60%, #0a0600 100%)',
  'linear-gradient(135deg, #c8940c 0%, #7d5a0b 60%, #3d2200 100%)',
  'linear-gradient(135deg, #3d2200 0%, #1e1500 60%, #0a0600 100%)',
  'linear-gradient(135deg, #7d5a0b 0%, #c8940c 50%, #5c3d00 100%)',
  'linear-gradient(135deg, #4a2c0a 0%, #2d1a06 60%, #0a0600 100%)',
]

export default function GalleryPage() {
  useScrollReveal()
  const [galleryImages, setGalleryImages] = useState([])
  const [lightbox, setLightbox] = useState(null)
  const [imgError, setImgError] = useState({})

  useEffect(() => {
    supabase
      .from('gallery_items')
      .select('*')
      .eq('is_atmosphere', false)
      .order('sort_order')
      .then(({ data }) => { if (data) setGalleryImages(data) })
  }, [])

  const handleImgError = (id) => setImgError(prev => ({ ...prev, [id]: true }))

  return (
    <>
      <div className="page-hero">
        <p className="section-label">Inside Khula</p>
        <h1 style={{ fontFamily: 'var(--font-playfair)' }}>Gallery</h1>
        <p>A glimpse into the world we've created for you.</p>
      </div>

      <section style={{ padding: '80px 0', background: '#0a0600' }}>
        <div className="section-wrap">
          {galleryImages.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 0', color: 'rgba(255,255,255,0.25)', fontSize: '15px' }}>
              Gallery photos coming soon.
            </div>
          )}
          <div className="gallery-grid">
            {galleryImages.map((img, i) => (
              <div
                key={img.id}
                data-reveal
                data-delay={`${(i % 3) * 120}`}
                onClick={() => setLightbox({ ...img, _index: i })}
                className={`card-lift${i === 0 ? ' gallery-card-wide' : ''}`}
                style={{
                  position: 'relative',
                  height: i === 0 || i === 3 ? '420px' : '320px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  background: fallbackGradients[i % fallbackGradients.length],
                  border: '1px solid #2e2000',
                }}
              >
                {!imgError[img.id] && img.image_url && (
                  <img
                    src={img.image_url}
                    alt={img.label}
                    onError={() => handleImgError(img.id)}
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                )}

                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(10,6,0,0.85) 0%, rgba(10,6,0,0.1) 50%, transparent 100%)',
                }} />

                <div
                  className="gallery-hover"
                  style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                    padding: '24px', opacity: 0, transition: 'opacity 0.3s',
                    background: 'rgba(10,6,0,0.3)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                >
                  <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.8)' }}>Click to expand →</p>
                </div>

                <div style={{
                  position: 'absolute', bottom: '16px', left: '16px',
                  background: 'rgba(10,6,0,0.75)', backdropFilter: 'blur(8px)',
                  padding: '6px 12px', borderRadius: '20px',
                  fontSize: '11px', letterSpacing: '2px', textTransform: 'uppercase', color: '#f5c842',
                }}>
                  {img.label}
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
            background: 'rgba(10,6,0,0.97)', backdropFilter: 'blur(20px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div onClick={e => e.stopPropagation()} style={{
            maxWidth: '860px', width: '100%', borderRadius: '20px',
            overflow: 'hidden', border: '1px solid #2e2000',
          }}>
            <div style={{
              height: '520px', position: 'relative',
              background: fallbackGradients[lightbox._index % fallbackGradients.length],
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {!imgError[lightbox.id] && lightbox.image_url && (
                <img
                  src={lightbox.image_url}
                  alt={lightbox.label}
                  onError={() => handleImgError(lightbox.id)}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0 }}
                />
              )}
            </div>
            <div style={{
              background: '#1e1500', padding: '24px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '20px', color: '#fafafa' }}>{lightbox.label}</p>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>Khula Cafe — Pinetown</p>
              </div>
              <button onClick={() => setLightbox(null)} style={{
                background: '#2e2000', border: 'none', color: '#fafafa', cursor: 'pointer',
                width: '40px', height: '40px', borderRadius: '50%', fontSize: '18px',
              }}>×</button>
            </div>
          </div>
        </div>
      )}

      {/* CTA */}
      <section style={{ padding: '80px 32px', textAlign: 'center', background: '#140e00', borderTop: '1px solid #2e2000' }}>
        <h2 data-reveal style={{ fontFamily: 'var(--font-playfair)', fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 700, color: '#fafafa', marginBottom: '16px' }}>
          Experience It In Person
        </h2>
        <p data-reveal data-delay="100" style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', maxWidth: '400px', margin: '0 auto 32px', lineHeight: 1.7 }}>
          Photos can only capture so much. Reserve your table and feel the Khula magic.
        </p>
        <Link data-reveal data-delay="200" href="/book" style={{
          textDecoration: 'none', fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase',
          fontWeight: 600, color: '#0a0600', padding: '14px 40px', borderRadius: '50px',
          background: 'linear-gradient(135deg, #f5c842, #c8940c)',
          boxShadow: '0 6px 20px rgba(200,148,12,0.4)', display: 'inline-block',
        }}>
          Reserve a Table
        </Link>
      </section>
    </>
  )
}
