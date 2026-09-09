'use client'
export const dynamic = 'force-dynamic'
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
    <div className="cart-page" style={{ background: '#0a0600', minHeight: '100vh', padding: '120px 0 60px' }}>
      <div className="section-wrap cart-wrap" style={{ maxWidth: '720px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <h1 className="cart-title" style={{ fontFamily: 'var(--font-playfair)', color: '#fafafa', fontSize: '36px', margin: 0 }}>Your Order</h1>
          <button onClick={clearCart} style={{ flexShrink: 0, background: 'none', border: '1px solid #2e2000', borderRadius: '20px', padding: '7px 14px', color: 'rgba(255,255,255,0.45)', fontSize: '11px', cursor: 'pointer', letterSpacing: '1px' }}>
            Clear all
          </button>
        </div>

        {/* Item list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
          {items.map(item => (
            <div key={item.id} className="cart-item" style={{
              background: '#1e1500', border: '1px solid #2e2000', borderRadius: '14px', padding: '14px',
            }}>
              {/* Top line: photo, name, remove */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {item.image_url && (
                  <img src={item.image_url} alt={item.name} style={{ width: '52px', height: '52px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ color: '#fafafa', fontSize: '15px', fontWeight: 600, margin: '0 0 3px', lineHeight: 1.3 }}>{item.name}</p>
                  <p style={{ color: 'rgba(255,255,255,0.45)', fontSize: '12px', margin: 0 }}>R{(item.price_cents / 100).toFixed(2)} each</p>
                </div>
                <button onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name}`} style={{
                  flexShrink: 0, width: '30px', height: '30px', borderRadius: '50%',
                  background: 'none', border: '1px solid #2e2000', color: 'rgba(255,255,255,0.4)',
                  fontSize: '16px', lineHeight: 1, cursor: 'pointer',
                }}>×</button>
              </div>

              {/* Bottom line: qty stepper + line total */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#0a0600', border: '1px solid #2e2000', borderRadius: '22px', padding: '3px' }}>
                  <button onClick={() => updateQty(item.id, item.qty - 1)} aria-label="Decrease quantity" style={{
                    width: '32px', height: '32px', borderRadius: '50%', border: 'none',
                    background: 'transparent', color: '#fafafa', fontSize: '17px', cursor: 'pointer',
                  }}>−</button>
                  <span style={{ color: '#fafafa', minWidth: '26px', textAlign: 'center', fontSize: '15px', fontWeight: 600 }}>{item.qty}</span>
                  <button onClick={() => updateQty(item.id, item.qty + 1)} aria-label="Increase quantity" style={{
                    width: '32px', height: '32px', borderRadius: '50%', border: 'none',
                    background: 'transparent', color: '#fafafa', fontSize: '17px', cursor: 'pointer',
                  }}>+</button>
                </div>
                <p style={{ color: GOLD, fontSize: '17px', fontWeight: 700, margin: 0, whiteSpace: 'nowrap' }}>
                  R{(item.price_cents * item.qty / 100).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Total + CTA */}
        <div className="cart-summary" style={{ background: '#1e1500', border: '1px solid #2e2000', borderRadius: '14px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px', marginBottom: '18px' }}>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '14px' }}>Subtotal</span>
            <span className="cart-total" style={{ fontFamily: 'var(--font-playfair)', color: GOLD, fontSize: '28px', fontWeight: 700, whiteSpace: 'nowrap' }}>
              R{(totalCents / 100).toFixed(2)}
            </span>
          </div>
          <Link href="/checkout" className="cart-cta" style={{
            display: 'block', textAlign: 'center', textDecoration: 'none',
            fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase',
            fontWeight: 700, color: '#0a0600', padding: '16px',
            borderRadius: '12px', background: 'linear-gradient(135deg, #f5c842, #c8940c)',
          }}>
            Proceed to Checkout →
          </Link>
          <Link href="/menu" style={{
            display: 'block', textAlign: 'center', textDecoration: 'none',
            fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '14px', letterSpacing: '1px',
          }}>
            ← Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}
