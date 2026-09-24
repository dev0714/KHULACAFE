'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../../../lib/supabase-public'
import VoucherCard from '../../../components/VoucherCard'

const GOLD = '#f5c842'

const shareBtn = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
  cursor: 'pointer', textDecoration: 'none', borderRadius: '30px',
  padding: '13px 22px', fontSize: '12px', fontWeight: 700,
  letterSpacing: '1px', textTransform: 'uppercase', border: '1px solid #2e2000',
  background: '#1e1500', color: 'rgba(255,255,255,0.7)',
}

export default function VoucherPage() {
  const { code } = useParams()
  const [voucher, setVoucher] = useState(null)
  const [copied, setCopied] = useState(false)
  const [url, setUrl] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') setUrl(window.location.href)
  }, [])

  useEffect(() => {
    if (!code) return
    supabase.from('vouchers').select('*').eq('code', String(code).toUpperCase()).maybeSingle()
      .then(({ data }) => setVoucher(data ?? false))
  }, [code])

  const wrap = { background: '#0a0600', minHeight: '100vh', padding: '130px 20px 70px', display: 'flex', justifyContent: 'center' }

  if (voucher === false) {
    return <div style={wrap}><p style={{ color: 'rgba(255,255,255,0.45)' }}>We could not find that voucher.</p></div>
  }
  if (!voucher) {
    return <div style={wrap}><p style={{ color: 'rgba(255,255,255,0.4)' }}>Loading…</p></div>
  }

  const rands = Math.round((voucher.amount_cents || 0) / 100)
  const spent = Boolean(voucher.redeemed_at)
  const expired = voucher.expires_at && voucher.expires_at < new Date().toISOString().slice(0, 10)

  const shareText = `${voucher.sender_name ? `${voucher.sender_name} has sent you` : "Here's"} a R${rands} Khula Cafe gift voucher! Code ${voucher.code}. ${url}`
  const waHref = `https://wa.me/?text=${encodeURIComponent(shareText)}`
  const mailHref = `mailto:?subject=${encodeURIComponent(`A R${rands} Khula Cafe gift voucher for you`)}&body=${encodeURIComponent(shareText)}`

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {}
  }

  return (
    <div style={wrap}>
      <div style={{ maxWidth: '520px', width: '100%' }}>
        {(spent || expired) && (
          <div style={{
            background: 'rgba(255,107,107,0.1)', border: '1px solid rgba(255,107,107,0.35)',
            borderRadius: '10px', padding: '12px 16px', marginBottom: '18px',
          }}>
            <p style={{ margin: 0, color: '#ff8a7a', fontSize: '13px', fontWeight: 600 }}>
              {spent ? 'This voucher has already been used.' : 'This voucher has expired.'}
            </p>
          </div>
        )}

        <div className="no-print-hide">
          <VoucherCard voucher={voucher} />
        </div>

        <div className="voucher-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '24px', justifyContent: 'center' }}>
          <a href={waHref} target="_blank" rel="noopener noreferrer"
             style={{ ...shareBtn, background: 'linear-gradient(135deg,#25D366,#1da851)', color: '#04210f', border: 'none' }}>
            Send on WhatsApp
          </a>
          <a href={mailHref} style={shareBtn}>Send by email</a>
          <button onClick={copyLink} style={shareBtn}>{copied ? 'Link copied' : 'Copy link'}</button>
          <button onClick={() => window.print()} style={shareBtn}>Print</button>
        </div>

        <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '12px', marginTop: '20px', lineHeight: 1.7 }}>
          Share this page with whoever the voucher is for. They enter the code at checkout
          or when paying a booking deposit.
        </p>

        <div style={{ textAlign: 'center', marginTop: '28px' }}>
          <Link href="/menu" style={{ color: GOLD, fontSize: '12px', letterSpacing: '1px', textDecoration: 'none' }}>
            View the Khula menu →
          </Link>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          .voucher-actions { display: none !important; }
          body { background: #fff !important; }
        }
      `}</style>
    </div>
  )
}
