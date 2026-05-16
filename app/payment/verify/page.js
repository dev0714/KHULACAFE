'use client'
import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function PaymentVerifyContent() {
  const params = useSearchParams()
  const router = useRouter()
  const [message, setMessage] = useState('Verifying payment…')

  useEffect(() => {
    const reference = params.get('reference')
    const orderId = params.get('orderId')

    if (!reference || !orderId) {
      setMessage('Missing payment reference. Redirecting to your order…')
      setTimeout(() => {
        if (orderId) router.replace(`/order-confirmed/${orderId}`)
        else router.replace('/menu')
      }, 1000)
      return
    }

    fetch(`/api/payments/paystack/verify?reference=${encodeURIComponent(reference)}&orderId=${encodeURIComponent(orderId)}`)
      .then(r => r.json().then(data => ({ ok: r.ok, data })))
      .then(({ ok, data }) => {
        if (!ok) throw new Error(data.error || 'Payment verification failed')
        setMessage(data.paid ? 'Payment successful. Redirecting…' : 'Payment not completed. Redirecting to your order…')
        setTimeout(() => router.replace(`/order-confirmed/${orderId}`), 1200)
      })
      .catch(() => {
        setMessage('Could not verify payment right now. Redirecting to your order…')
        setTimeout(() => router.replace(`/order-confirmed/${orderId}`), 1200)
      })
  }, [params, router])

  return (
    <div style={{ minHeight: '70vh', background: '#0a0600', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: 'rgba(255,255,255,0.7)' }}>{message}</p>
    </div>
  )
}

export default function PaymentVerifyPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: '70vh', background: '#0a0600', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'rgba(255,255,255,0.7)' }}>Loading payment status…</p>
      </div>
    }>
      <PaymentVerifyContent />
    </Suspense>
  )
}
