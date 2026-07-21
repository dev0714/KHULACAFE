import { redirect } from 'next/navigation'
import Link from 'next/link'
import { getCustomer } from '../../lib/customer-auth'
import LogoutButton from './LogoutButton'

export const metadata = { title: 'My Account' }
export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const customer = await getCustomer()
  if (!customer) redirect('/login')

  const memberSince = customer.created_at
    ? new Date(customer.created_at).toLocaleDateString('en-ZA', { month: 'long', year: 'numeric' })
    : null

  return (
    <>
      <div className="page-hero">
        <p className="section-label">My Account</p>
        <h1 style={{ fontFamily: 'var(--font-playfair)' }}>Hi, {customer.name.split(' ')[0]}</h1>
        <p>Welcome back to Khula Cafe.</p>
      </div>

      <section style={{ padding: '60px 0 100px', background: '#0a0600' }}>
        <div className="section-wrap" style={{ maxWidth: '560px' }}>

          {/* Khula Bucks card */}
          <div style={{
            background: 'linear-gradient(135deg, #1e1500, #2e2000)',
            border: '1px solid #c8940c', borderRadius: '18px', padding: '28px', marginBottom: '20px',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <div>
              <p style={{ fontSize: '11px', letterSpacing: '3px', textTransform: 'uppercase', color: '#f5c842', marginBottom: '8px' }}>Khula Bucks</p>
              <p style={{ fontFamily: 'var(--font-playfair)', fontSize: '40px', fontWeight: 700, color: '#fafafa', lineHeight: 1 }}>
                {customer.khula_bucks ?? 0}
              </p>
            </div>
            <div style={{ fontSize: '40px' }}>{customer.is_gold ? '🥇' : '💛'}</div>
          </div>

          {/* Details */}
          <div style={{ background: '#1e1500', border: '1px solid #2e2000', borderRadius: '16px', padding: '24px', marginBottom: '20px' }}>
            {[
              { label: 'Name', value: customer.name },
              { label: 'Email', value: customer.email },
              { label: 'Phone', value: customer.phone || '—' },
              { label: 'Status', value: customer.is_gold ? 'Gold Member' : 'Member' },
              ...(memberSince ? [{ label: 'Member Since', value: memberSince }] : []),
            ].map((row, i, arr) => (
              <div key={row.label} style={{
                display: 'flex', justifyContent: 'space-between', padding: '12px 0',
                borderBottom: i < arr.length - 1 ? '1px solid #2e2000' : 'none',
              }}>
                <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>{row.label}</span>
                <span style={{ fontSize: '13px', color: '#fafafa', fontWeight: 500 }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <Link href="/book" style={{
              textDecoration: 'none', textAlign: 'center', padding: '16px', borderRadius: '12px',
              background: 'linear-gradient(135deg, #f5c842, #c8940c)', color: '#0a0600',
              fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 700,
            }}>Book a Table</Link>
            <Link href="/menu" style={{
              textDecoration: 'none', textAlign: 'center', padding: '16px', borderRadius: '12px',
              background: '#1e1500', border: '1px solid #2e2000', color: '#fafafa',
              fontSize: '12px', letterSpacing: '2px', textTransform: 'uppercase', fontWeight: 600,
            }}>View Menu</Link>
          </div>

          <LogoutButton />
        </div>
      </section>
    </>
  )
}
