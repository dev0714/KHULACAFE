'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '../lib/cart-context'

export default function CartButton() {
  const { count } = useCart()
  const pathname = usePathname()

  const hide = pathname.startsWith('/admin') || pathname.startsWith('/staff-login') ||
    pathname === '/cart' || pathname === '/checkout' || pathname.startsWith('/order-confirmed')
  if (hide) return null

  return (
    <Link href="/cart" style={{
      position: 'fixed', bottom: '32px', right: '32px', zIndex: 1000,
      width: '58px', height: '58px', borderRadius: '50%',
      background: 'linear-gradient(135deg, #f5c842, #c8940c)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      textDecoration: 'none', boxShadow: '0 8px 24px rgba(200,148,12,0.45)',
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(200,148,12,0.6)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(200,148,12,0.45)' }}
    >
      <span style={{ fontSize: '22px' }}>🛒</span>
      {count > 0 && (
        <span style={{
          position: 'absolute', top: '-4px', right: '-4px',
          background: '#0a0600', color: '#f5c842',
          borderRadius: '50%', width: '20px', height: '20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '10px', fontWeight: 700, border: '2px solid #f5c842',
        }}>
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}
