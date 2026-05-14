'use client'
export const dynamic = 'force-dynamic'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase-public'

export default function OrderConfirmedPage() {
  const { id } = useParams()
  const [order, setOrder] = useState(null)
  const [items, setItems] = useState([])

  useEffect(() => {
    if (!id) return
    Promise.all([
      supabase.from('orders').select('*').eq('id', id).single(),
      supabase.from('order_items').select('*').eq('order_id', id).order('created_at'),
    ]).then(([{ data: o }, { data: i }]) => {
      if (o) setOrder(o)
      if (i) setItems(i)
    })
  }, [id])

  if (!order) {
    return (
      <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0600' }}>
        <p style={{ color: 'rgba(255,255,255,0.4)' }}>Loading order…</p>
      </div>
    )
  }

  const ref = `#${id.slice(0, 8).toUpperCase()}`

  return (
    <div style={{ background: '#0a0600', minHeight: '100vh', padding: '80px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: '520px', width: '100%', textAlign: 'center' }}>
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>🎉</div>
        <h1 style={{ fontFamily: 'var(--font-playfair)', color: '#f5c842', fontSize: '36px', marginBottom: '8px' }}>Order Placed!</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>Reference: <strong style={{ color: '#fafafa' }}>{ref}</strong></p>
        {order.customer_email && (
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px', marginBottom: '32px' }}>
            Confirmation sent to {order.customer_email}
          </p>
        )}

        {/* Order items */}
        <div style={{ background: '#1e1500', border: '1px solid #2e2000', borderRadius: '14px', padding: '24px', marginBottom: '24px', textAlign: 'left' }}>
          <p style={{ fontSize: '10px', letterSpacing: '3px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '16px' }}>Your Order</p>
          {items.map(item => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '8px' }}>
              <span>{item.quantity}× {item.name}</span>
              <span>R{(item.price_cents * item.quantity / 100).toFixed(2)}</span>
            </div>
          ))}
          <div style={{ borderTop: '1px solid #2e2000', paddingTop: '12px', marginTop: '8px', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#fafafa', fontWeight: 700 }}>Total</span>
            <span style={{ color: '#f5c842', fontWeight: 700 }}>R{(order.total_cents / 100).toFixed(2)}</span>
          </div>
        </div>

        {/* Status */}
        <div style={{ background: 'rgba(245,200,66,0.06)', border: '1px solid rgba(245,200,66,0.2)', borderRadius: '10px', padding: '14px', marginBottom: '32px', fontSize: '13px', color: 'rgba(255,255,255,0.6)' }}>
          📦 <strong style={{ color: '#f5c842' }}>Status: Order Received</strong><br />
          <span style={{ fontSize: '12px' }}>
            {order.delivery_type === 'delivery' ? `Delivering to: ${order.delivery_address}` : 'Ready for pickup at Khula Cafe'}
          </span>
        </div>

        <Link href="/menu" style={{
          textDecoration: 'none', fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase',
          fontWeight: 600, color: '#0a0600', padding: '14px 36px', borderRadius: '50px',
          background: 'linear-gradient(135deg, #f5c842, #c8940c)', display: 'inline-block',
        }}>
          Order Again
        </Link>
      </div>
    </div>
  )
}
