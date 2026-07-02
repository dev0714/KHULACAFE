'use client'
import { useState, useEffect } from 'react'

export default function InstallPWA() {
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [notSafari, setNotSafari] = useState(false)

  useEffect(() => {
    if (window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches) return
    const isMobile = window.innerWidth < 1024 && ('ontouchstart' in window || navigator.maxTouchPoints > 0)
    if (!isMobile) return
    if (localStorage.getItem('pwa-banner-dismissed')) return

    const ua = navigator.userAgent
    const ios = /iphone|ipad|ipod/i.test(ua)
    const isSafari = /safari/i.test(ua) && !/chrome|crios|fxios|opios/i.test(ua)

    if (ios) {
      setIsIOS(true)
      if (!isSafari) setNotSafari(true) // on iOS but not in Safari
      setShow(true)
      return
    }

    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    localStorage.setItem('pwa-banner-dismissed', '1')
    setShow(false)
  }

  async function installAndroid() {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setShow(false)
    setDeferredPrompt(null)
  }

  if (!show) return null

  // iOS but not in Safari — can't install from Chrome/Firefox on iOS
  if (notSafari) return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9998,
      background: '#1e1500', borderTop: '1px solid #3d2a00',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.5)',
      padding: '14px 16px',
      display: 'flex', gap: '12px', alignItems: 'center',
    }}>
      <span style={{ fontSize: '28px', flexShrink: 0 }}>⚠️</span>
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 700, fontSize: '13px', color: '#f5c842', marginBottom: '2px' }}>Open in Safari to install</p>
        <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>
          Copy this URL, paste it in <strong style={{ color: '#fafafa' }}>Safari</strong>, then tap Share → "Add to Home Screen"
        </p>
      </div>
      <button onClick={dismiss} style={{ background: 'none', border: '1px solid #3d2a00', borderRadius: '8px', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '11px', padding: '8px 12px', flexShrink: 0 }}>✕</button>
    </div>
  )

  // iOS Safari — show step-by-step guide
  if (isIOS) return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9998,
      background: '#1e1500', borderTop: '2px solid #c8940c',
      boxShadow: '0 -8px 32px rgba(0,0,0,0.6)',
      padding: '16px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/icons/apple-touch-icon.png" alt="" style={{ width: '40px', height: '40px', borderRadius: '10px', flexShrink: 0 }} />
          <div>
            <p style={{ fontWeight: 700, fontSize: '14px', color: '#fafafa', marginBottom: '1px' }}>Install Khula Cafe</p>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>Add to your iPhone Home Screen</p>
          </div>
        </div>
        <button onClick={dismiss} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: '4px' }}>✕</button>
      </div>

      {/* Steps */}
      <div style={{ display: 'flex', gap: '0', marginBottom: '14px' }}>
        {[
          { n: '1', icon: '⬆️', text: 'Tap the Share button at the bottom of Safari' },
          { n: '2', icon: '➕', text: 'Scroll down and tap "Add to Home Screen"' },
          { n: '3', icon: '✅', text: 'Tap "Add" — the icon saves to your Home Screen' },
        ].map((s, i) => (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', position: 'relative', padding: '0 4px' }}>
            {i < 2 && (
              <div style={{ position: 'absolute', top: '14px', right: '-4px', fontSize: '12px', color: 'rgba(255,255,255,0.2)', zIndex: 1 }}>›</div>
            )}
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#2e2000', border: '1px solid #c8940c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', marginBottom: '6px', flexShrink: 0 }}>
              {s.icon}
            </div>
            <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>{s.text}</p>
          </div>
        ))}
      </div>

      <button onClick={dismiss} style={{
        width: '100%', padding: '11px', borderRadius: '10px', border: 'none',
        background: 'linear-gradient(135deg, #f5c842, #c8940c)',
        color: '#0a0600', fontWeight: 700, fontSize: '13px', cursor: 'pointer',
      }}>
        Got it — I'll follow the steps above
      </button>
    </div>
  )

  // Android / Chrome — native install button
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9998,
      background: '#1e1500', borderTop: '1px solid #3d2a00',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.5)',
      padding: '16px 20px',
      display: 'flex', gap: '14px', alignItems: 'center',
    }}>
      <img src="/icons/apple-touch-icon.png" alt="Khula Cafe" style={{ width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: '14px', color: '#fafafa', marginBottom: '3px' }}>Install Khula Cafe</p>
        <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>Add to your home screen for quick access.</p>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
        <button onClick={installAndroid} style={{
          padding: '9px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
          background: 'linear-gradient(135deg, #f5c842, #c8940c)',
          color: '#0a0600', fontWeight: 700, fontSize: '12px', whiteSpace: 'nowrap',
        }}>
          Install
        </button>
        <button onClick={dismiss} style={{
          padding: '8px 20px', borderRadius: '8px', border: '1px solid #3d2a00',
          background: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '12px',
        }}>
          Not now
        </button>
      </div>
    </div>
  )
}
