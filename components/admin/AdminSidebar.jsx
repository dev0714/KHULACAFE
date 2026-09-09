'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getOrderCounts } from '../../app/admin/actions'
import { getUnreadMessageCount } from '../../app/admin/messages/actions'
import { Icon } from './ui'

export const NAV_GROUPS = [
  { group: 'Operations', items: [
    { href: '/admin', label: 'Dashboard', icon: 'grid', exact: true },
    { href: '/admin/orders', label: 'Orders', icon: 'receipt', badge: 'orders' },
    { href: '/admin/bookings', label: 'Bookings', icon: 'calendar' },
    { href: '/admin/messages', label: 'Messages', icon: 'mail', badge: 'messages' },
  ]},
  { group: 'Content', items: [
    { href: '/admin/menu', label: 'Menu', icon: 'utensils' },
    { href: '/admin/gallery', label: 'Gallery', icon: 'image' },
    { href: '/admin/contact', label: 'Find Us', icon: 'pin' },
  ]},
  { group: 'Customers', items: [
    { href: '/admin/customers', label: 'Customers', icon: 'users' },
    { href: '/admin/loyalty', label: 'Khula Bucks', icon: 'coin' },
    { href: '/admin/vouchers', label: 'Vouchers', icon: 'ticket' },
  ]},
  { group: 'Settings', items: [
    { href: '/admin/payments', label: 'Payments', icon: 'card' },
    { href: '/admin/settings', label: 'Email', icon: 'settings' },
    { href: '/admin/users', label: 'Staff Users', icon: 'key' },
  ]},
]

export const ALL_NAV = NAV_GROUPS.flatMap(g => g.items)

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [counts, setCounts] = useState({ orders: 0, messages: 0 })
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const refresh = () => {
      getOrderCounts().then(c => setCounts(p => ({ ...p, orders: (c.received ?? 0) + (c.making ?? 0) + (c.out_for_delivery ?? 0) }))).catch(() => {})
      getUnreadMessageCount().then(n => setCounts(p => ({ ...p, messages: n }))).catch(() => {})
    }
    refresh()
    const interval = setInterval(refresh, 30000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => { setOpen(false) }, [pathname])
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  async function handleSignOut() {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/staff-login')
    router.refresh()
  }

  const isActive = (item) => item.exact ? pathname === item.href : pathname.startsWith(item.href)

  const navContent = (
    <>
      <div style={{ padding: '0 6px 18px', margin: '0 8px', borderBottom: '1px solid var(--adm-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <img src="/images/logo.png" alt="Khula" width={40} height={50} style={{ display: 'block', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '16px', fontWeight: 700, color: 'var(--adm-text)' }}>Khula Cafe</span>
          <span style={{ fontSize: '10px', letterSpacing: '2px', color: 'var(--adm-gold)', textTransform: 'uppercase' }}>Admin</span>
        </div>
        <button onClick={() => setOpen(false)} className="admin-drawer-close" aria-label="Close menu"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--adm-faint)', padding: '4px', display: 'flex' }}>
          {Icon.x(18)}
        </button>
      </div>

      <nav style={{ flex: 1, padding: '10px 8px', overflowY: 'auto' }}>
        {NAV_GROUPS.map(g => (
          <div key={g.group}>
            <div className="adm-nav-group">{g.group}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {g.items.map(item => {
                const badge = item.badge ? counts[item.badge] : 0
                return (
                  <Link key={item.href} href={item.href} className={`adm-nav-item${isActive(item) ? ' active' : ''}`}>
                    {Icon[item.icon](18)}
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {badge > 0 && <span className="adm-badge">{badge}</span>}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div style={{ margin: '0 8px', padding: '14px 6px 0', borderTop: '1px solid var(--adm-border)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Link href="/" target="_blank" className="adm-nav-item" style={{ padding: '8px 12px' }}>
          {Icon.ext(16)}<span>View site</span>
        </Link>
        <button onClick={handleSignOut} className="adm-nav-item" style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', padding: '8px 12px', fontFamily: 'inherit' }}>
          {Icon.logout(16)}<span>Sign out</span>
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="admin-sidebar-desktop adm-aside-in" style={{
        width: '240px', flexShrink: 0, background: 'var(--adm-side)',
        borderRight: '1px solid var(--adm-border)', minHeight: '100vh',
        display: 'flex', flexDirection: 'column', padding: '22px 6px',
        position: 'sticky', top: 0, height: '100vh',
      }}>
        {navContent}
      </aside>

      {/* Mobile top bar */}
      <div className="admin-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img src="/images/logo.png" alt="Khula" width={32} height={40} style={{ display: 'block' }} />
          <span style={{ fontSize: '11px', letterSpacing: '3px', color: 'var(--adm-gold)', textTransform: 'uppercase' }}>Admin</span>
        </div>
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="adm-iconbtn" style={{ color: 'var(--adm-gold)' }}>
          {Icon.menu(22)}
          {(counts.orders + counts.messages) > 0 && <span className="adm-ping" />}
        </button>
      </div>

      {/* Overlay */}
      {open && (
        <div onClick={() => setOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1199, backdropFilter: 'blur(4px)' }} />
      )}

      {/* Mobile drawer */}
      <aside className="admin-sidebar-mobile" style={{ transform: open ? 'translateX(0)' : 'translateX(-100%)', padding: '22px 6px' }}>
        {navContent}
      </aside>
    </>
  )
}
