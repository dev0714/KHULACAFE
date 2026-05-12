'use client'
import { useCart } from '../../lib/cart-context'
import Link from 'next/link'

const GOLD = '#f5c842'

export default function CartPage() {
  const { items, removeItem, updateQty, totalCents, clearCart } = useCart()

  if (items.length === 0) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px', background: '#0a0600' }}>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>🛒</div>
        <h2 style={{ fontFamily: 'var(--font-playfair)', color: '#fafafa', fontSize: '28px', marginBottom: '12px' }}>Your cart is empty</h2>
        <p style={{ color: 'rgba(255,255,255,0.45)', marginBottom: '32px' }}>Add some Khula favourites to get started.</p>
        <Link href="/menu" style={{
          textDecoration: 'none', fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase',
          fontWeight: 700, color: '#0a0600', padding: '14px 36px', borderRadius: '50px',
          background: 'linear-gradient(135deg, #f5c842, #c8940c)',
        }}>
          View Menu
        </Link>
      </div>
    )
  }

  return (
    <div style={{ background: '#0a0600', minHeight: '100vh', padding: '60px 0' }}>
      <div className="section-wrap" style={{ maxWidth: '720px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h1 style={{ fontFamily: 'var(--font-playfair)', color: '#fafafa', fontSize: '36px' }}>Your Order</h1>
          <button onClick={clearCart} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '12px', cursor: 'pointer', letterSpacing: '1px' }}>
            Clear all
          </button>
        </div>

        {/* Item list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
          {items.map(item => (
            <div key={item.id} style={{
              display: 'flex', alignItems: 'center', gap: '16px',
              background: '#1e1500', border: '1px solid #2e2000', borderRadius: '12px', padding: '16px',
            }}>
              {item.image_url && (
                <img src={item.image_url} alt={item.name} style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
              )}
              <div style={{ flex: 1 }}>
                <p style={{ color: '#fafafa', fontSize: '15px', fontWeight: 600, margin: '0 0 4px' }}>{item.name}</p>
                <p style={{ color: GOLD, fontSize: '14px', margin: 0 }}>R{(item.price_cents / 100).toFixed(2)} each</p>
              </div>
              {/* Qty controls */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button onClick={() => updateQty(item.id, item.qty - 1)} style={{
                  width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #2e2000',
                  background: '#0a0600', color: '#fafafa', fontSize: '16px', cursor: 'pointer',
                }}>−</button>
                <span style={{ color: '#fafafa', minWidth: '24px', textAlign: 'center', fontSize: '15px' }}>{item.qty}</span>
                <button onClick={() => updateQty(item.id, item.qty + 1)} style={{
                  width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #2e2000',
                  background: '#0a0600', color: '#fafafa', fontSize: '16px', cursor: 'pointer',
                }}>+</button>
              </div>
              <p style={{ color: GOLD, fontSize: '15px', fontWeight: 700, minWidth: '72px', textAlign: 'right', margin: 0 }}>
                R{(item.price_cents * item.qty / 100).toFixed(2)}
              </p>
              <button onClick={() => removeItem(item.id)} style={{
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', fontSize: '18px', cursor: 'pointer', padding: '4px',
              }}>×</button>
            </div>
          ))}
        </div>

        {/* Total + CTA */}
        <div style={{ background: '#1e1500', border: '1px solid #2e2000', borderRadius: '14px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>Subtotal</span>
            <span style={{ fontFamily: 'var(--font-playfair)', color: GOLD, fontSize: '28px', fontWeight: 700 }}>
              R{(totalCents / 100).toFixed(2)}
            </span>
          </div>
          <Link href="/checkout" style={{
            display: 'block', textAlign: 'center', textDecoration: 'none',
            fontSize: '12px', letterSpacing: '3px', textTransform: 'uppercase',
            fontWeight: 700, color: '#0a0600', padding: '16px',
            borderRadius: '10px', background: 'linear-gradient(135deg, #f5c842, #c8940c)',
          }}>
            Proceed to Checkout →
          </Link>
          <Link href="/menu" style={{
            display: 'block', textAlign: 'center', textDecoration: 'none',
            fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '12px', letterSpacing: '1px',
          }}>
            ← Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
