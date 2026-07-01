'use client'
import { useState, useEffect } from 'react'

export default function InstallPWA() {
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState(null)

  useEffect(() => {
    // Never show if already installed (standalone mode)
    if (window.navigator.standalone || window.matchMedia('(display-mode: standalone)').matches) return
    // Never show if dismissed before
    if (sessionStorage.getItem('pwa-banner-dismissed')) return

    const ua = navigator.userAgent
    const ios = /iphone|ipad|ipod/i.test(ua)
    const isSafari = /safari/i.test(ua) && !/chrome|crios|fxios|opios/i.test(ua)

    if (ios) {
      // Only prompt in Safari — Chrome/Firefox on iOS can't install PWAs
      if (isSafari) { setIsIOS(true); setShow(true) }
      return
    }

    // Android / Desktop Chrome — listen for the browser prompt
    const handler = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShow(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  function dismiss() {
    sessionStorage.setItem('pwa-banner-dismissed', '1')
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

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9998,
      background: '#1e1500',
      borderTop: '1px solid #3d2a00',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.5)',
      padding: '16px 20px',
      display: 'flex', gap: '14px', alignItems: 'flex-start',
    }}>
      {/* Icon */}
      <img src="/icons/apple-touch-icon.png" alt="Khula Cafe" style={{ width: '48px', height: '48px', borderRadius: '12px', flexShrink: 0 }} />

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: '14px', color: '#fafafa', marginBottom: '4px' }}>
          Add Khula Cafe to your Home Screen
        </p>
        {isIOS ? (
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
            Tap the{' '}
            <span style={{ display: 'inline-block', background: '#2e2000', borderRadius: '4px', padding: '1px 6px', fontWeight: 700, color: '#f5c842', letterSpacing: '0.5px' }}>
              Share
            </span>
            {' '}button{' '}
            <span style={{ fontSize: '15px' }}>⎙</span>{' '}
            then <strong style={{ color: '#fafafa' }}>"Add to Home Screen"</strong>
          </p>
        ) : (
          <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
            Install for quick access — works offline too.
          </p>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0 }}>
        {!isIOS && (
          <button onClick={installAndroid} style={{
            padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg, #f5c842, #c8940c)',
            color: '#0a0600', fontWeight: 700, fontSize: '12px', whiteSpace: 'nowrap',
          }}>
            Install
          </button>
        )}
        <button onClick={dismiss} style={{
          padding: '8px 16px', borderRadius: '8px', border: '1px solid #3d2a00',
          background: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '12px',
        }}>
          {isIOS ? 'Got it' : 'Not now'}
        </button>
      </div>
    </div>
  )
}
