# Online Ordering System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Allow customers to add menu items to a cart, check out as a guest or registered member, pay via AO Pay (placeholder), and receive email confirmation — with staff managing live order status in the admin CRM.

**Architecture:** Cart state lives in React Context backed by localStorage (no login required). Orders are written to Supabase via a Next.js API route using the service-role client. The admin Orders page reads orders via server actions and updates status with a server action that also fires a Resend status-change email to the customer.

**Tech Stack:** Next.js 14 App Router, Supabase (Khulacafe schema), React Context, Resend (email), AO Pay placeholder

---

## Codebase Context

- Schema: `Khulacafe` (not public) — all Supabase table references need this schema
- Supabase anon client: `lib/supabase-public.js` → `export const supabase`
- Supabase admin client: `lib/supabase-admin.js` → `export const supabaseAdmin` (server-only)
- Server actions: `app/admin/actions.js` — all start with `await assertAdmin()`
- Admin sidebar: `components/admin/AdminSidebar.jsx` — navItems array
- ConditionalShell strips Navbar/Footer only for `/admin/*` and `/staff-login` — cart/checkout/order pages keep the navbar automatically
- Money is always stored as integers (cents). `price_cents` on menu_items. Display as `(price_cents / 100).toFixed(2)`
- Menu items have both `price` (text, e.g. "R85") and `price_cents` (int). Items with `price = 'Ask us'` have no `price_cents` — don't allow adding these to cart.
- Resend API key goes in `.env.local` as `RESEND_API_KEY`
- AO Pay credentials go in `.env.local` as `AOPAY_MERCHANT_ID` and `AOPAY_SECRET` (leave empty for now)

---

## Files

**Create:**
- `lib/cart-context.js` — CartProvider + useCart hook, localStorage persistence
- `lib/resend.js` — sendOrderConfirmation + sendStatusUpdate helpers
- `components/CartButton.jsx` — floating cart FAB with item count badge
- `app/cart/page.js` — cart review: item list, qty controls, total, checkout CTA
- `app/checkout/page.js` — guest form, delivery/pickup toggle, AO Pay step, submit
- `app/order-confirmed/[id]/page.js` — confirmation screen with order summary
- `app/api/orders/create/route.js` — POST: validate, insert order + items, earn bucks, send email
- `app/admin/orders/page.js` — orders list + status pipeline UI

**Modify:**
- `app/layout.js` — wrap body with CartProvider, add CartButton
- `app/menu/page.js` — Add to Cart button on each item (price_cents items only)
- `app/page.js` — Add to Cart on featured items
- `app/admin/actions.js` — add getOrders, updateOrderStatus, getOrderCounts
- `components/admin/AdminSidebar.jsx` — add Orders nav item
- `app/admin/page.js` — add Orders stat card

---

## Task 1: Database — orders and order_items tables

**Files:**
- Run SQL in Supabase SQL editor

- [ ] **Step 1: Run this SQL in Supabase Dashboard → SQL Editor**

```sql
create table "Khulacafe".orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_email text,
  customer_phone text,
  delivery_type text not null default 'pickup',
  delivery_address text,
  status text not null default 'received',
  total_cents int not null,
  notes text,
  payment_status text not null default 'pending',
  payment_reference text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table "Khulacafe".order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references "Khulacafe".orders(id) on delete cascade,
  menu_item_id uuid,
  name text not null,
  quantity int not null default 1,
  price_cents int not null,
  created_at timestamptz default now()
);

alter table "Khulacafe".orders enable row level security;
alter table "Khulacafe".order_items enable row level security;

grant all on "Khulacafe".orders to service_role;
grant all on "Khulacafe".order_items to service_role;
grant usage on sequence "Khulacafe".orders_id_seq to anon, authenticated;

-- Anon can place orders
create policy "anon_insert_orders" on "Khulacafe".orders
  for insert to anon with check (true);

create policy "anon_insert_order_items" on "Khulacafe".order_items
  for insert to anon with check (true);

-- Anon can read order by ID (for confirmation page)
create policy "anon_select_orders" on "Khulacafe".orders
  for select to anon using (true);

create policy "anon_select_order_items" on "Khulacafe".order_items
  for select to anon using (true);
```

- [ ] **Step 2: Verify in Supabase Table Editor**

Check that `Khulacafe.orders` and `Khulacafe.order_items` appear with correct columns.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "feat: add orders and order_items tables to Khulacafe schema"
```

---

## Task 2: Cart Context

**Files:**
- Create: `lib/cart-context.js`

- [ ] **Step 1: Create `lib/cart-context.js`**

```js
'use client'
import { createContext, useContext, useState, useEffect } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('khula_cart')
      if (saved) setItems(JSON.parse(saved))
    } catch {}
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated) localStorage.setItem('khula_cart', JSON.stringify(items))
  }, [items, hydrated])

  function addItem(item) {
    // item shape: { id, name, price_cents, image_url? }
    setItems(prev => {
      const existing = prev.find(i => i.id === item.id)
      if (existing) return prev.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i)
      return [...prev, { ...item, qty: 1 }]
    })
  }

  function removeItem(id) {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  function updateQty(id, qty) {
    if (qty <= 0) { removeItem(id); return }
    setItems(prev => prev.map(i => i.id === id ? { ...i, qty } : i))
  }

  function clearCart() { setItems([]) }

  const totalCents = items.reduce((sum, i) => sum + i.price_cents * i.qty, 0)
  const count = items.reduce((sum, i) => sum + i.qty, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, totalCents, count }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
```

- [ ] **Step 2: Commit**

```bash
git add lib/cart-context.js
git commit -m "feat: add CartProvider context with localStorage persistence"
```

---

## Task 3: CartButton component

**Files:**
- Create: `components/CartButton.jsx`

- [ ] **Step 1: Create `components/CartButton.jsx`**

```jsx
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
```

- [ ] **Step 2: Commit**

```bash
git add components/CartButton.jsx
git commit -m "feat: add floating CartButton with badge"
```

---

## Task 4: Wire CartProvider and CartButton into the layout

**Files:**
- Modify: `app/layout.js`

- [ ] **Step 1: Update `app/layout.js`**

Current file wraps children in `ConditionalShell`. Add CartProvider around it and CartButton inside it.

```js
import './globals.css'
import { Playfair_Display } from 'next/font/google'
import ConditionalShell from '../components/ConditionalShell'
import { CartProvider } from '../lib/cart-context'
import CartButton from '../components/CartButton'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

export const metadata = {
  title: 'Khula Cafe',
  description: 'Best of the Best — Pinetown',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={playfair.variable}>
      <head />
      <body style={{ margin: 0, background: '#0a0600', color: '#fafafa', fontFamily: 'system-ui, sans-serif' }}>
        <CartProvider>
          <ConditionalShell>{children}</ConditionalShell>
          <CartButton />
        </CartProvider>
      </body>
    </html>
  )
}
```

> Note: Check the actual current `app/layout.js` before editing — preserve any existing font imports, metadata, or head content. Only add CartProvider and CartButton; don't restructure what's already there.

- [ ] **Step 2: Verify dev server starts without errors**

```bash
npm run dev
```

Expected: No errors in terminal. Home page loads. Cart button is visible in bottom-right.

- [ ] **Step 3: Commit**

```bash
git add app/layout.js
git commit -m "feat: wrap layout with CartProvider, add CartButton"
```

---

## Task 5: Add to Cart on Menu page

**Files:**
- Modify: `app/menu/page.js`

- [ ] **Step 1: Add useCart import and Add to Cart button to menu item cards**

At the top of `app/menu/page.js`, add:

```js
import { useCart } from '../../lib/cart-context'
```

Inside `MenuPage`, destructure `addItem` from useCart:

```js
const { addItem, items } = useCart()
```

Add a helper to check if an item is already in cart:

```js
function cartQty(itemId) {
  return items.find(i => i.id === itemId)?.qty ?? 0
}
```

Replace the bottom of each item card (the `<div>` with price + Order link) with:

```jsx
<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
  <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '24px', color: '#f5c842', fontWeight: 600 }}>
    {item.price}
  </span>
  {item.price_cents ? (
    <button
      onClick={() => addItem({ id: item.id, name: item.name, price_cents: item.price_cents, image_url: item.image_url || null })}
      style={{
        fontSize: '11px', letterSpacing: '1.5px', textTransform: 'uppercase',
        fontWeight: 700, color: '#0a0600', padding: '8px 18px', borderRadius: '30px',
        background: cartQty(item.id) > 0
          ? 'linear-gradient(135deg, #c8940c, #a07008)'
          : 'linear-gradient(135deg, #f5c842, #c8940c)',
        border: 'none', cursor: 'pointer', transition: 'all 0.2s',
      }}
    >
      {cartQty(item.id) > 0 ? `In Cart (${cartQty(item.id)})` : 'Add to Cart'}
    </button>
  ) : (
    <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px' }}>
      Call to order
    </span>
  )}
</div>
```

- [ ] **Step 2: Test in browser**

Navigate to `/menu`. Click "Add to Cart" on an item. Verify:
- Button label changes to "In Cart (1)"
- Cart FAB badge shows 1

- [ ] **Step 3: Commit**

```bash
git add app/menu/page.js
git commit -m "feat: add Add to Cart buttons to menu page"
```

---

## Task 6: Add to Cart on Home page featured items

**Files:**
- Modify: `app/page.js`

- [ ] **Step 1: Import useCart in `app/page.js`**

```js
import { useCart } from '../lib/cart-context'
```

Inside `HomePage`, add:

```js
const { addItem, items } = useCart()
function cartQty(itemId) { return items.find(i => i.id === itemId)?.qty ?? 0 }
```

- [ ] **Step 2: Replace "Order →" span on featured item cards**

Find the `<span>` with `Order →` in the featured items section and replace with:

```jsx
{item.price_cents ? (
  <button
    onClick={() => addItem({ id: item.id, name: item.name, price_cents: item.price_cents, image_url: item.image_url || null })}
    style={{
      fontSize: '10px', letterSpacing: '1.5px', textTransform: 'uppercase', fontWeight: 700,
      color: '#0a0600', padding: '7px 16px', borderRadius: '30px', border: 'none', cursor: 'pointer',
      background: cartQty(item.id) > 0 ? 'linear-gradient(135deg, #c8940c, #a07008)' : 'linear-gradient(135deg, #f5c842, #c8940c)',
    }}
  >
    {cartQty(item.id) > 0 ? `In Cart (${cartQty(item.id)})` : 'Add →'}
  </button>
) : (
  <span style={{ fontSize: '11px', color: '#c8940c', textTransform: 'uppercase', letterSpacing: '2px' }}>Order →</span>
)}
```

- [ ] **Step 3: Commit**

```bash
git add app/page.js
git commit -m "feat: add Add to Cart on home page featured items"
```

---

## Task 7: Cart page

**Files:**
- Create: `app/cart/page.js`

- [ ] **Step 1: Create `app/cart/page.js`**

```js
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
```

- [ ] **Step 2: Test cart page**

Add items from menu, navigate to `/cart`. Verify qty controls, remove, clear all, total updates.

- [ ] **Step 3: Commit**

```bash
git add app/cart/page.js
git commit -m "feat: add cart review page"
```

---

## Task 8: Install Resend and create email helper

**Files:**
- Create: `lib/resend.js`
- Modify: `.env.local`

- [ ] **Step 1: Install Resend**

```bash
npm install resend
```

- [ ] **Step 2: Add to `.env.local`**

```
RESEND_API_KEY=re_your_key_here
AOPAY_MERCHANT_ID=
AOPAY_SECRET=
```

Get the Resend API key from resend.com → API Keys. The from-address domain must be verified in Resend.

- [ ] **Step 3: Create `lib/resend.js`**

```js
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = 'Khula Cafe <orders@khulacafe.co.za>'

const STATUS_COPY = {
  making:           { subject: 'Your order is being prepared 👨‍🍳', body: 'Great news — our kitchen has started on your order!' },
  out_for_delivery: { subject: 'Your order is on its way! 🛵',    body: 'Your order has left Khula Cafe and is heading your way.' },
  delivered:        { subject: 'Order delivered! ☕',              body: 'Your order has been delivered. Enjoy — and thank you for choosing Khula!' },
}

function orderRef(id) { return `#${id.slice(0, 8).toUpperCase()}` }

function itemsHtml(items) {
  return items.map(i =>
    `<tr><td style="padding:6px 0;">${i.qty}× ${i.name}</td><td style="text-align:right;padding:6px 0;">R${(i.price_cents * i.qty / 100).toFixed(2)}</td></tr>`
  ).join('')
}

export async function sendOrderConfirmation({ order, items }) {
  if (!order.customer_email) return
  if (!process.env.RESEND_API_KEY) return   // silently skip if not configured

  const total = `R${(order.total_cents / 100).toFixed(2)}`
  const delivery = order.delivery_type === 'delivery'
    ? `Delivery to: ${order.delivery_address}`
    : 'Pickup from Khula Cafe'

  await resend.emails.send({
    from: FROM,
    to: order.customer_email,
    subject: `Order received ${orderRef(order.id)} — Khula Cafe`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
        <div style="background:#0a0600;padding:24px;text-align:center">
          <h1 style="color:#f5c842;font-size:24px;margin:0">Khula Cafe</h1>
        </div>
        <div style="padding:32px 24px">
          <h2 style="margin:0 0 8px">Thanks for your order, ${order.customer_name}!</h2>
          <p style="color:#555">We've received your order and will start preparing it shortly.</p>
          <p><strong>Reference:</strong> ${orderRef(order.id)}<br><strong>Type:</strong> ${delivery}</p>
          <table style="width:100%;border-top:1px solid #eee;margin:24px 0">
            ${itemsHtml(items)}
            <tr style="border-top:1px solid #eee;font-weight:700">
              <td style="padding:10px 0">Total</td>
              <td style="text-align:right;padding:10px 0">${total}</td>
            </tr>
          </table>
          <p style="color:#888;font-size:13px">We'll email you as your order progresses.</p>
        </div>
      </div>
    `,
  })
}

export async function sendStatusUpdate({ order, status }) {
  if (!order.customer_email) return
  if (!process.env.RESEND_API_KEY) return
  const copy = STATUS_COPY[status]
  if (!copy) return

  await resend.emails.send({
    from: FROM,
    to: order.customer_email,
    subject: `${copy.subject} — ${orderRef(order.id)}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;color:#1a1a1a">
        <div style="background:#0a0600;padding:24px;text-align:center">
          <h1 style="color:#f5c842;font-size:24px;margin:0">Khula Cafe</h1>
        </div>
        <div style="padding:32px 24px">
          <h2>${copy.subject}</h2>
          <p>${copy.body}</p>
          <p><strong>Order reference:</strong> ${orderRef(order.id)}</p>
          <p style="color:#888;font-size:13px">Thank you for choosing Khula Cafe!</p>
        </div>
      </div>
    `,
  })
}
```

- [ ] **Step 4: Commit**

```bash
git add lib/resend.js .env.local
git commit -m "feat: add Resend email helpers for order confirmation and status updates"
```

---

## Task 9: Order creation API route

**Files:**
- Create: `app/api/orders/create/route.js`

- [ ] **Step 1: Create `app/api/orders/create/route.js`**

```js
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '../../../../lib/supabase-admin'
import { sendOrderConfirmation } from '../../../../lib/resend'

export async function POST(request) {
  const body = await request.json()
  const { customerName, customerEmail, customerPhone, deliveryType, deliveryAddress, notes, items } = body

  if (!customerName || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'Customer name and at least one item are required' }, { status: 400 })
  }
  if (deliveryType === 'delivery' && !deliveryAddress?.trim()) {
    return NextResponse.json({ error: 'Delivery address is required for delivery orders' }, { status: 400 })
  }

  const totalCents = items.reduce((sum, i) => sum + i.price_cents * i.qty, 0)

  const { data: order, error: orderError } = await supabaseAdmin
    .from('orders')
    .insert({
      customer_name: customerName.trim(),
      customer_email: customerEmail?.toLowerCase().trim() || null,
      customer_phone: customerPhone?.trim() || null,
      delivery_type: deliveryType,
      delivery_address: deliveryType === 'delivery' ? deliveryAddress.trim() : null,
      notes: notes?.trim() || null,
      total_cents: totalCents,
      status: 'received',
      payment_status: 'pending',
    })
    .select()
    .single()

  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 500 })

  const { error: itemsError } = await supabaseAdmin.from('order_items').insert(
    items.map(i => ({
      order_id: order.id,
      menu_item_id: i.id || null,
      name: i.name,
      quantity: i.qty,
      price_cents: i.price_cents,
    }))
  )
  if (itemsError) return NextResponse.json({ error: itemsError.message }, { status: 500 })

  // Auto-earn Khula Bucks if email matches a loyalty customer
  if (customerEmail) {
    const { data: customer } = await supabaseAdmin
      .from('customers')
      .select('id, khula_bucks')
      .eq('email', customerEmail.toLowerCase().trim())
      .single()

    if (customer) {
      const { data: cfg } = await supabaseAdmin.from('loyalty_config').select('*').eq('id', 1).single()
      const earnRate = cfg?.earn_rate_points_per_rand ?? 1
      const bucksPerHundred = cfg?.bucks_per_100_points ?? 10
      const bucks = Math.floor((totalCents / 100) * earnRate / 100 * bucksPerHundred)

      if (bucks > 0) {
        await supabaseAdmin.from('transactions').insert({
          customer_id: customer.id,
          type: 'purchase',
          amount_cents: totalCents,
          bucks_earned: bucks,
          bucks_redeemed: 0,
          notes: `Online order ${order.id.slice(0, 8).toUpperCase()}`,
        })
        await supabaseAdmin.from('customers').update({
          khula_bucks: customer.khula_bucks + bucks,
        }).eq('id', customer.id)
      }
    }
  }

  // Send confirmation email (non-blocking)
  sendOrderConfirmation({ order, items }).catch(() => {})

  return NextResponse.json({ orderId: order.id })
}
```

- [ ] **Step 2: Test with curl**

```bash
curl -X POST http://localhost:3000/api/orders/create \
  -H "Content-Type: application/json" \
  -d '{"customerName":"Test","customerEmail":"test@test.com","customerPhone":"0800000000","deliveryType":"pickup","items":[{"id":"fake-id","name":"Bunny Chow","price_cents":8500,"qty":1}]}'
```

Expected response: `{"orderId":"<uuid>"}`

- [ ] **Step 3: Commit**

```bash
git add app/api/orders/create/route.js
git commit -m "feat: add order creation API with Khula Bucks auto-earn"
```

---

## Task 10: Checkout page

**Files:**
- Create: `app/checkout/page.js`

- [ ] **Step 1: Create `app/checkout/page.js`**

```js
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useCart } from '../../lib/cart-context'

const inputStyle = {
  width: '100%', padding: '12px 14px', boxSizing: 'border-box',
  background: '#1e1500', border: '1px solid #2e2000', borderRadius: '8px',
  color: '#fafafa', fontSize: '14px', outline: 'none',
}
const labelStyle = {
  display: 'block', fontSize: '10px', letterSpacing: '2px',
  color: '#f5c842', marginBottom: '6px', textTransform: 'uppercase',
}

export default function CheckoutPage() {
  const { items, totalCents, clearCart } = useCart()
  const router = useRouter()

  const [form, setForm] = useState({ name: '', email: '', phone: '', deliveryType: 'pickup', address: '', notes: '' })
  const [step, setStep] = useState('details') // 'details' | 'payment'
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  if (items.length === 0) {
    router.push('/cart')
    return null
  }

  async function handleDetailsSubmit(e) {
    e.preventDefault()
    if (form.deliveryType === 'delivery' && !form.address.trim()) {
      setError('Please enter your delivery address.')
      return
    }
    setError('')
    setStep('payment')
  }

  async function handlePlaceOrder() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/orders/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.name,
          customerEmail: form.email || null,
          customerPhone: form.phone || null,
          deliveryType: form.deliveryType,
          deliveryAddress: form.address || null,
          notes: form.notes || null,
          items,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Order failed')
      clearCart()
      router.push(`/order-confirmed/${data.orderId}`)
    } catch (err) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div style={{ background: '#0a0600', minHeight: '100vh', padding: '60px 0' }}>
      <div className="section-wrap" style={{ maxWidth: '640px' }}>
        <Link href="/cart" style={{ color: 'rgba(255,255,255,0.35)', fontSize: '12px', textDecoration: 'none', letterSpacing: '1px', display: 'block', marginBottom: '32px' }}>
          ← Back to Cart
        </Link>

        <h1 style={{ fontFamily: 'var(--font-playfair)', color: '#fafafa', fontSize: '34px', marginBottom: '32px' }}>Checkout</h1>

        {step === 'details' && (
          <form onSubmit={handleDetailsSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* Delivery toggle */}
            <div style={{ background: '#1e1500', border: '1px solid #2e2000', borderRadius: '10px', padding: '4px', display: 'flex', gap: '4px' }}>
              {['pickup', 'delivery'].map(type => (
                <button key={type} type="button" onClick={() => set('deliveryType', type)} style={{
                  flex: 1, padding: '10px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                  background: form.deliveryType === type ? 'linear-gradient(135deg, #f5c842, #c8940c)' : 'transparent',
                  color: form.deliveryType === type ? '#0a0600' : 'rgba(255,255,255,0.5)',
                  fontWeight: 700, fontSize: '12px', letterSpacing: '1.5px', textTransform: 'uppercase',
                }}>
                  {type === 'pickup' ? '🏠 Pickup' : '🛵 Delivery'}
                </button>
              ))}
            </div>

            <div>
              <label style={labelStyle}>Full Name *</label>
              <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} required
                onFocus={e => e.target.style.borderColor = '#f5c842'}
                onBlur={e => e.target.style.borderColor = '#2e2000'} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div>
                <label style={labelStyle}>Email</label>
                <input style={inputStyle} type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  onFocus={e => e.target.style.borderColor = '#f5c842'}
                  onBlur={e => e.target.style.borderColor = '#2e2000'} />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input style={inputStyle} value={form.phone} onChange={e => set('phone', e.target.value)}
                  onFocus={e => e.target.style.borderColor = '#f5c842'}
                  onBlur={e => e.target.style.borderColor = '#2e2000'} />
              </div>
            </div>

            {form.deliveryType === 'delivery' && (
              <div>
                <label style={labelStyle}>Delivery Address *</label>
                <input style={inputStyle} value={form.address} onChange={e => set('address', e.target.value)} required
                  placeholder="Street, Suburb, City"
                  onFocus={e => e.target.style.borderColor = '#f5c842'}
                  onBlur={e => e.target.style.borderColor = '#2e2000'} />
              </div>
            )}

            <div>
              <label style={labelStyle}>Special Instructions</label>
              <input style={inputStyle} value={form.notes} onChange={e => set('notes', e.target.value)}
                placeholder="Allergies, gate code, etc."
                onFocus={e => e.target.style.borderColor = '#f5c842'}
                onBlur={e => e.target.style.borderColor = '#2e2000'} />
            </div>

            {/* Khula Bucks nudge */}
            <div style={{ background: 'rgba(245,200,66,0.06)', border: '1px solid rgba(245,200,66,0.2)', borderRadius: '10px', padding: '14px 16px', fontSize: '13px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>
              💛 <strong style={{ color: '#f5c842' }}>Earn Khula Bucks</strong> — Enter your email to automatically earn loyalty points on this order. Already a member? Points are added to your account automatically.
            </div>

            {error && <p style={{ color: '#ff6b6b', fontSize: '13px', margin: 0 }}>{error}</p>}

            <button type="submit" style={{
              padding: '15px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              background: 'linear-gradient(135deg, #f5c842, #c8940c)',
              color: '#0a0600', fontWeight: 700, fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase',
            }}>
              Continue to Payment →
            </button>
          </form>
        )}

        {step === 'payment' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Order summary */}
            <div style={{ background: '#1e1500', border: '1px solid #2e2000', borderRadius: '12px', padding: '20px' }}>
              <p style={{ fontSize: '10px', letterSpacing: '3px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '14px' }}>Order Summary</p>
              {items.map(i => (
                <div key={i.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: 'rgba(255,255,255,0.7)', marginBottom: '6px' }}>
                  <span>{i.qty}× {i.name}</span>
                  <span>R{(i.price_cents * i.qty / 100).toFixed(2)}</span>
                </div>
              ))}
              <div style={{ borderTop: '1px solid #2e2000', paddingTop: '12px', marginTop: '12px', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#fafafa', fontWeight: 700 }}>Total</span>
                <span style={{ color: '#f5c842', fontFamily: 'var(--font-playfair)', fontSize: '20px', fontWeight: 700 }}>R{(totalCents / 100).toFixed(2)}</span>
              </div>
            </div>

            {/* AO Pay placeholder */}
            <div style={{ background: '#1e1500', border: '1px solid #2e2000', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
              <p style={{ fontSize: '10px', letterSpacing: '3px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', marginBottom: '16px' }}>Payment</p>
              <div style={{ background: '#140e00', borderRadius: '8px', padding: '20px', marginBottom: '16px' }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '13px', margin: 0 }}>
                  🔒 Secure payment via AO Pay
                </p>
                <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '11px', marginTop: '8px' }}>
                  Payment gateway coming soon — your order will be placed and payment collected at pickup/delivery.
                </p>
              </div>

              {error && <p style={{ color: '#ff6b6b', fontSize: '13px', marginBottom: '12px' }}>{error}</p>}

              <button onClick={handlePlaceOrder} disabled={loading} style={{
                width: '100%', padding: '15px', borderRadius: '10px', border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? '#2e2000' : 'linear-gradient(135deg, #f5c842, #c8940c)',
                color: loading ? 'rgba(255,255,255,0.4)' : '#0a0600',
                fontWeight: 700, fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase',
              }}>
                {loading ? 'Placing Order…' : `Place Order — R${(totalCents / 100).toFixed(2)}`}
              </button>
            </div>

            <button onClick={() => setStep('details')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: '12px', cursor: 'pointer', letterSpacing: '1px' }}>
              ← Edit Details
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Test checkout flow end-to-end**

1. Add items to cart from `/menu`
2. Go to `/cart`, click Proceed to Checkout
3. Fill in details, select pickup
4. Click Continue to Payment
5. Click Place Order
6. Expect redirect to `/order-confirmed/<id>`
7. Check Supabase Table Editor — order row should appear in `Khulacafe.orders`

- [ ] **Step 3: Commit**

```bash
git add app/checkout/page.js
git commit -m "feat: add checkout page with delivery/pickup toggle and AO Pay placeholder"
```

---

## Task 11: Order confirmation page

**Files:**
- Create: `app/order-confirmed/[id]/page.js`

- [ ] **Step 1: Create `app/order-confirmed/[id]/page.js`**

```js
'use client'
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
```

- [ ] **Step 2: Commit**

```bash
git add "app/order-confirmed/[id]/page.js"
git commit -m "feat: add order confirmation page"
```

---

## Task 12: Admin — order server actions

**Files:**
- Modify: `app/admin/actions.js`

- [ ] **Step 1: Add order actions to `app/admin/actions.js`**

Add at the bottom of the file (before the last closing, after existing actions):

```js
// ── Orders ───────────────────────────────────────────────────────
export async function getOrders() {
  await assertAdmin()
  const { data } = await supabaseAdmin
    .from('orders')
    .select('*, order_items(*)')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function getOrderCounts() {
  await assertAdmin()
  const { data } = await supabaseAdmin.from('orders').select('status')
  const counts = { total: 0, received: 0, making: 0, out_for_delivery: 0, delivered: 0 }
  for (const o of data ?? []) {
    counts.total++
    counts[o.status] = (counts[o.status] ?? 0) + 1
  }
  return counts
}

export async function updateOrderStatus(orderId, status) {
  await assertAdmin()
  await supabaseAdmin
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)

  // Fire status email non-blocking
  const { data: order } = await supabaseAdmin.from('orders').select('*').eq('id', orderId).single()
  if (order?.customer_email && status !== 'received') {
    import('../../../lib/resend').then(({ sendStatusUpdate }) => {
      sendStatusUpdate({ order, status }).catch(() => {})
    })
  }

  revalidatePath('/admin/orders')
}
```

- [ ] **Step 2: Commit**

```bash
git add app/admin/actions.js
git commit -m "feat: add getOrders, updateOrderStatus server actions"
```

---

## Task 13: Admin Orders page

**Files:**
- Create: `app/admin/orders/page.js`

- [ ] **Step 1: Create `app/admin/orders/page.js`**

```js
'use client'
import { useState, useEffect, useCallback } from 'react'
import { getOrders, updateOrderStatus } from '../actions'

const STATUSES = [
  { key: 'received',         label: 'Received',          color: '#6b9fff', icon: '📥' },
  { key: 'making',           label: 'Being Made',        color: '#f5c842', icon: '👨‍🍳' },
  { key: 'out_for_delivery', label: 'Out for Delivery',  color: '#ff9f43', icon: '🛵' },
  { key: 'delivered',        label: 'Delivered',         color: '#26de81', icon: '✅' },
]

function statusMeta(key) { return STATUSES.find(s => s.key === key) ?? STATUSES[0] }

function nextStatus(key) {
  const idx = STATUSES.findIndex(s => s.key === key)
  return idx < STATUSES.length - 1 ? STATUSES[idx + 1] : null
}

function OrderCard({ order, onStatusChange }) {
  const [updating, setUpdating] = useState(false)
  const meta = statusMeta(order.status)
  const next = nextStatus(order.status)
  const ref = `#${order.id.slice(0, 8).toUpperCase()}`
  const time = new Date(order.created_at).toLocaleString('en-ZA', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

  async function advance() {
    if (!next) return
    setUpdating(true)
    await updateOrderStatus(order.id, next.key)
    await onStatusChange()
    setUpdating(false)
  }

  return (
    <div style={{
      background: '#1e1500', border: `1px solid ${meta.color}33`,
      borderLeft: `3px solid ${meta.color}`,
      borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ color: '#fafafa', fontWeight: 700, fontSize: '15px', margin: '0 0 2px' }}>{order.customer_name}</p>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0 }}>{ref} · {time}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: `${meta.color}18`, color: meta.color,
            padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
          }}>
            {meta.icon} {meta.label}
          </span>
        </div>
      </div>

      {/* Items */}
      <div>
        {(order.order_items ?? []).map(i => (
          <p key={i.id} style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', margin: '2px 0' }}>
            {i.quantity}× {i.name} — R{(i.price_cents * i.quantity / 100).toFixed(2)}
          </p>
        ))}
      </div>

      {/* Meta row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
        <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
          {order.delivery_type === 'delivery'
            ? `🛵 Delivery — ${order.delivery_address}`
            : '🏠 Pickup'}
          {order.customer_phone && ` · ${order.customer_phone}`}
          {order.notes && <span style={{ display: 'block', color: 'rgba(255,255,255,0.3)', marginTop: '2px' }}>📝 {order.notes}</span>}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ color: '#f5c842', fontFamily: 'var(--font-playfair)', fontSize: '18px', fontWeight: 700 }}>
            R{(order.total_cents / 100).toFixed(2)}
          </span>
          {next && (
            <button onClick={advance} disabled={updating} style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              background: `linear-gradient(135deg, ${next.color}, ${next.color}bb)`,
              color: '#0a0600', fontWeight: 700, fontSize: '11px', cursor: updating ? 'not-allowed' : 'pointer',
              opacity: updating ? 0.6 : 1, letterSpacing: '0.5px',
            }}>
              {updating ? '…' : `${next.icon} Mark ${next.label}`}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('active') // 'active' | 'delivered' | 'all'
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const data = await getOrders()
    setOrders(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = orders.filter(o => {
    if (filter === 'active') return o.status !== 'delivered'
    if (filter === 'delivered') return o.status === 'delivered'
    return true
  })

  const activeCount = orders.filter(o => o.status !== 'delivered').length

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h1 style={{ fontFamily: 'var(--font-playfair)', color: '#fafafa', fontSize: '28px', margin: 0 }}>Orders</h1>
        <button onClick={load} style={{ background: 'none', border: '1px solid #2e2000', borderRadius: '8px', color: 'rgba(255,255,255,0.4)', padding: '6px 14px', cursor: 'pointer', fontSize: '12px' }}>
          Refresh
        </button>
      </div>

      {/* Status legend */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {STATUSES.map(s => (
          <span key={s.key} style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: s.color, background: `${s.color}15`, padding: '4px 10px', borderRadius: '20px' }}>
            {s.icon} {s.label}
          </span>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '4px', background: '#1e1500', borderRadius: '10px', padding: '4px', border: '1px solid #2e2000', marginBottom: '20px', width: 'fit-content' }}>
        {[
          { key: 'active', label: `Active${activeCount > 0 ? ` (${activeCount})` : ''}` },
          { key: 'delivered', label: 'Delivered' },
          { key: 'all', label: 'All' },
        ].map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)} style={{
            padding: '7px 18px', borderRadius: '7px', border: 'none', cursor: 'pointer',
            background: filter === t.key ? '#2e2000' : 'transparent',
            color: filter === t.key ? '#f5c842' : 'rgba(255,255,255,0.4)',
            fontSize: '12px', fontWeight: filter === t.key ? 700 : 400,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px' }}>Loading orders…</p>}

      {!loading && filtered.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.25)', fontSize: '14px' }}>
          {filter === 'active' ? 'No active orders right now.' : 'No orders found.'}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {filtered.map(order => (
          <OrderCard key={order.id} order={order} onStatusChange={load} />
        ))}
      </div>
    </>
  )
}
```

- [ ] **Step 2: Verify in browser**

Navigate to `/admin/orders`. Place a test order from the public site. Refresh admin orders. Verify:
- Order appears under "Active"
- "Mark Being Made" button advances the status
- Color coding matches status

- [ ] **Step 3: Commit**

```bash
git add app/admin/orders/page.js
git commit -m "feat: add admin orders page with status pipeline"
```

---

## Task 14: Wire Orders into admin sidebar and dashboard

**Files:**
- Modify: `components/admin/AdminSidebar.jsx`
- Modify: `app/admin/page.js`

- [ ] **Step 1: Add Orders to sidebar navItems in `components/admin/AdminSidebar.jsx`**

Find the `navItems` array and add Orders after Customers:

```js
{ href: '/admin/orders', label: 'Orders', icon: '📦' },
```

- [ ] **Step 2: Add Orders stat card to `app/admin/page.js`**

Import `getOrderCounts` in the server action call:

```js
import { getDashboardChartData, getOrderCounts } from './actions'
```

In `useEffect`, add `getOrderCounts()` call alongside `getDashboardChartData()`:

```js
Promise.all([
  getDashboardChartData(),
  getOrderCounts(),
]).then(([chartData, orderCounts]) => {
  setCharts(chartData)
  setStats(prev => ({
    ...prev,
    customers: chartData.totalCustomers ?? 0,
    totalBucks: chartData.totalBucks ?? 0,
    activeOrders: orderCounts.received + orderCounts.making + orderCounts.out_for_delivery,
    totalOrders: orderCounts.total,
  }))
})
```

Add to `useState` initial state:

```js
const [stats, setStats] = useState({
  customers: 0, totalBucks: 0, activeOrders: 0, totalOrders: 0,
  categories: 0, items: 0, featured: 0,
  gallery: 0, atmosphere: 0, occasions: 0, addons: 0,
})
```

Add to `statCards`:

```js
{ label: 'Active Orders', value: stats.activeOrders, icon: '📦' },
{ label: 'Total Orders', value: stats.totalOrders, icon: '🧾' },
```

- [ ] **Step 3: Commit**

```bash
git add components/admin/AdminSidebar.jsx app/admin/page.js
git commit -m "feat: add Orders to admin sidebar and dashboard stats"
```

---

## Self-Review

**Spec coverage check:**
- ✅ Cart + Add to Cart on menu and home page
- ✅ Guest checkout with name/email/phone
- ✅ Delivery / Pickup toggle
- ✅ Khula Bucks nudge on checkout (prompt to provide email)
- ✅ AO Pay placeholder (structure ready, credentials wired later)
- ✅ Order creation → Supabase
- ✅ Auto-earn Khula Bucks by email match on order
- ✅ Confirmation email via Resend
- ✅ Order confirmation page
- ✅ Admin Orders page with 4-stage disposition (Received → Making → Out for Delivery → Delivered)
- ✅ Status-change emails to customer
- ✅ Orders in sidebar and dashboard stats

**Placeholder scan:** None found — all steps contain actual code.

**Type consistency:** `price_cents` used throughout. `qty` on cart items, `quantity` on `order_items` DB rows. The API route maps `i.qty` → `quantity` on insert. Confirmed consistent.
