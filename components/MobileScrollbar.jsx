'use client'
import { useEffect, useRef, useState } from 'react'

// Phones hide the page scrollbar and ignore any styling for it, so on touch
// devices we draw our own: a thin gold track down the right edge that is
// always visible and can be dragged to scroll.
const NAV_H = 102   // height of the white menu bar
const GAP = 6       // breathing room at top and bottom
const MIN_THUMB = 44

export default function MobileScrollbar() {
  const [enabled, setEnabled] = useState(false)
  const [state, setState] = useState({ show: false, top: 0, height: 0 })
  const dragging = useRef(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(pointer: coarse)')
    const update = () => setEnabled(mq.matches)
    update()
    mq.addEventListener?.('change', update)
    return () => mq.removeEventListener?.('change', update)
  }, [])

  useEffect(() => {
    if (!enabled) return
    let frame = 0
    const measure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const doc = document.documentElement
        const viewH = window.innerHeight
        const docH = doc.scrollHeight
        const track = viewH - NAV_H - GAP * 2
        if (docH <= viewH + 4 || track <= MIN_THUMB) { setState(s => (s.show ? { ...s, show: false } : s)); return }
        const height = Math.max(MIN_THUMB, Math.round(track * (viewH / docH)))
        const ratio = window.scrollY / (docH - viewH)
        const top = Math.round((track - height) * Math.min(1, Math.max(0, ratio)))
        setState({ show: true, top, height })
      })
    }
    measure()
    window.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    // Pages grow as menu items and images load, so re-measure on changes.
    const ro = new ResizeObserver(measure)
    ro.observe(document.body)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
      ro.disconnect()
    }
  }, [enabled])

  // Native listeners: React registers touchmove as passive, which would let
  // the phone scroll the page underneath the finger while we drag the thumb.
  const thumbRef = useRef(null)
  const heightRef = useRef(0)
  heightRef.current = state.height
  useEffect(() => {
    const el = thumbRef.current
    if (!el) return
    const start = (e) => {
      e.preventDefault()
      dragging.current = { startY: e.touches[0].clientY, startScroll: window.scrollY }
    }
    const move = (e) => {
      if (!dragging.current) return
      e.preventDefault()
      const doc = document.documentElement
      const viewH = window.innerHeight
      const track = viewH - NAV_H - GAP * 2
      const movable = Math.max(1, track - heightRef.current)
      const scrollable = doc.scrollHeight - viewH
      const dy = e.touches[0].clientY - dragging.current.startY
      window.scrollTo({ top: dragging.current.startScroll + (dy / movable) * scrollable, behavior: 'instant' })
    }
    const end = () => { dragging.current = null }
    el.addEventListener('touchstart', start, { passive: false })
    el.addEventListener('touchmove', move, { passive: false })
    el.addEventListener('touchend', end)
    el.addEventListener('touchcancel', end)
    return () => {
      el.removeEventListener('touchstart', start)
      el.removeEventListener('touchmove', move)
      el.removeEventListener('touchend', end)
      el.removeEventListener('touchcancel', end)
    }
  }, [enabled, state.show])

  if (!enabled || !state.show) return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed', right: 0, top: NAV_H + GAP, bottom: GAP,
        width: '22px', zIndex: 998, pointerEvents: 'none',
      }}
    >
      {/* Track */}
      <div style={{
        position: 'absolute', right: '3px', top: 0, bottom: 0, width: '4px',
        borderRadius: '4px', background: 'rgba(245,200,66,0.18)',
      }} />
      {/* Thumb — the wide invisible strip around it makes it easy to grab */}
      <div
        ref={thumbRef}
        style={{
          position: 'absolute', right: 0, width: '22px',
          top: state.top, height: state.height,
          pointerEvents: 'auto', touchAction: 'none',
        }}
      >
        <div style={{
          position: 'absolute', right: '2px', top: 0, bottom: 0, width: '6px',
          borderRadius: '6px', background: 'linear-gradient(180deg, #f5c842, #c8940c)',
          boxShadow: '0 0 6px rgba(0,0,0,0.5)',
        }} />
      </div>
    </div>
  )
}
