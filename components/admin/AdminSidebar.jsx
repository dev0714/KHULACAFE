'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { getOrderCounts } from '../../app/admin/actions'
import { getUnreadMessageCount } from '../../app/admin/messages/actions'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '🏠', exact: true },
  { href: '/admin/menu', label: 'Menu', icon: '🍽️' },
  { href: '/admin/gallery', label: 'Gallery', icon: '📸' },
  { href: '/admin/loyalty', label: 'Khula Bucks', icon: '💛' },
  { href: '/admin/bookings', label: 'Bookings', icon: '📅' },
  { href: '/admin/customers', label: 'Customers', icon: '👥' },
  { href: '/admin/orders', label: 'Orders', icon: '📦' },
  { href: '/admin/messages', label: 'Messages', icon: '✉️' },
  { href: '/admin/users', label: 'Users', icon: '🔑' },
  { href: '/admin/settings', label: 'Email Settings', icon: '⚙️' },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [activeOrders, setActiveOrders] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    getOrderCounts().then(c => {
      setActiveOrders((c.received ?? 0) + (c.making ?? 0) + (c.out_for_delivery ?? 0))
    }).catch(() => {})
    getUnreadMessageCount().then(setUnreadMessages).catch(() => {})

    const interval = setInterval(() => {
      getOrderCounts().then(c => {
        setActiveOrders((c.received ?? 0) + (c.making ?? 0) + (c.out_for_delivery ?? 0))
      }).catch(() => {})
      getUnreadMessageCount().then(setUnreadMessages).catch(() => {})
    }, 30000)
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

  const navContent = (
    <>
      <div style={{ padding: '0 24px 32px', borderBottom: '1px solid #2e2000', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <img src="/images/logo.png" alt="Khula" width={48} height={60} style={{ display: 'block' }} />
          <p style={{ fontSize: '10px', letterSpacing: '3px', color: '#f5c842', marginTop: '12px', textTransform: 'uppercase' }}>Admin</p>
        </div>
        <button onClick={() => setOpen(false)} className="admin-drawer-close" aria-label="Close menu"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.4)', fontSize: '20px', lineHeight: 1, padding: '4px', marginTop: '4px' }}>
          ✕
        </button>
      </div>

      <nav style={{ flex: 1, padding: '24px 12px', display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto' }}>
        {navItems.map(item => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          const isOrders = item.href === '/admin/orders'
          const isMessages = item.href === '/admin/messages'
          const badge = isOrders ? activeOrders : isMessages ? unreadMessages : 0
          return (
            <Link key={item.href} href={item.href} style={{
              textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '10px',
              padding: '11px 12px', borderRadius: '8px', fontSize: '13px',
              background: active ? '#2e2000' : 'transparent',
              color: active ? '#f5c842' : 'rgba(255,255,255,0.6)',
              transition: 'all 0.2s',
            }}>
              <span>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {badge > 0 && (
                <span style={{
                  background: '#f5c842', color: '#0a0600', borderRadius: '50%',
                  width: '18px', height: '18px', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', fontSize: '10px', fontWeight: 700, flexShrink: 0,
                }}>
                  {badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div style={{ padding: '24px 12px', borderTop: '1px solid #2e2000' }}>
        <Link href="/" target="_blank" style={{
          textDecoration: 'none', display: 'block', padding: '10px 12px',
          fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginBottom: '8px',
        }}>
          ↗ View Site
        </Link>
        <button onClick={handleSignOut} style={{
          width: '100%', padding: '10px 12px', background: 'none',
          border: '1px solid #2e2000', borderRadius: '8px', cursor: 'pointer',
          fontSize: '12px', color: 'rgba(255,255,255,0.5)', textAlign: 'left',
        }}>
          Sign Out
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="admin-sidebar-desktop" style={{
        width: '220px', flexShrink: 0, background: '#140e00',
        borderRight: '1px solid #2e2000', minHeight: '100vh',
        display: 'flex', flexDirection: 'column', padding: '32px 0',
      }}>
        {navContent}
      </aside>

      {/* Mobile top bar */}
      <div className="admin-topbar">
        <img src="/images/logo.png" alt="Khula" width={36} height={45} style={{ display: 'block' }} />
        <span style={{ fontSize: '11px', letterSpacing: '3px', color: '#f5c842', textTransform: 'uppercase' }}>Admin</span>
        <button onClick={() => setOpen(true)} aria-label="Open menu"
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {[0,1,2].map(i => (
            <span key={i} style={{ display: 'block', width: '22px', height: '2px', background: '#f5c842', borderRadius: '2px' }} />
          ))}
        </button>
      </div>

      {/* Overlay */}
      {open && (
        <div onClick={() => setOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', zIndex: 1199,
          backdropFilter: 'blur(4px)',
        }} />
      )}

      {/* Mobile drawer */}
      <aside className="admin-sidebar-mobile" style={{
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
      }}>
        {navContent}
      </aside>
    </>
  )
}
