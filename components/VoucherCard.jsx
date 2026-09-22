'use client'

// Four templates. Each keeps the Khula gold but changes the mood, so a
// birthday gift does not arrive looking like a corporate receipt.
export const VOUCHER_THEMES = {
  classic: {
    label: 'Classic gold',
    title: 'Gift Voucher',
    motif: '✦',
    bg: 'linear-gradient(150deg, #120c00 0%, #241a00 55%, #120c00 100%)',
    accent: '#f5c842',
    ink: '#fafafa',
    edge: 'rgba(245,200,66,0.45)',
  },
  birthday: {
    label: 'Birthday',
    title: 'Happy Birthday',
    motif: '🎂',
    bg: 'linear-gradient(150deg, #1a0a16 0%, #2c1226 55%, #1a0a16 100%)',
    accent: '#ffb3d1',
    ink: '#fff4f9',
    edge: 'rgba(255,179,209,0.45)',
  },
  thankyou: {
    label: 'Thank you',
    title: 'Thank You',
    motif: '🤍',
    bg: 'linear-gradient(150deg, #0d1410 0%, #16241b 55%, #0d1410 100%)',
    accent: '#9fe3b5',
    ink: '#f2fbf5',
    edge: 'rgba(159,227,181,0.45)',
  },
  celebration: {
    label: 'Celebration',
    title: 'Congratulations',
    motif: '🥂',
    bg: 'linear-gradient(150deg, #100a1c 0%, #1d1433 55%, #100a1c 100%)',
    accent: '#c3b0ff',
    ink: '#f6f3ff',
    edge: 'rgba(195,176,255,0.45)',
  },
}

const money = (cents) => `R${Math.round((cents || 0) / 100)}`
const prettyDate = (d) => d
  ? new Date(d + 'T00:00:00').toLocaleDateString('en-ZA', { day: 'numeric', month: 'long', year: 'numeric' })
  : null

export default function VoucherCard({ voucher, scale = 1 }) {
  const t = VOUCHER_THEMES[voucher.theme] || VOUCHER_THEMES.classic
  const px = (n) => `${Math.round(n * scale)}px`

  return (
    <div style={{
      background: t.bg,
      border: `1px solid ${t.edge}`,
      borderRadius: px(20),
      padding: px(34),
      color: t.ink,
      position: 'relative',
      overflow: 'hidden',
      maxWidth: px(520),
      width: '100%',
      boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
    }}>
      {/* Corner flourish */}
      <div aria-hidden style={{
        position: 'absolute', top: px(-40), right: px(-40),
        width: px(160), height: px(160), borderRadius: '50%',
        background: `radial-gradient(circle, ${t.accent}22 0%, transparent 70%)`,
      }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: px(12), marginBottom: px(24) }}>
        <span style={{ fontSize: px(11), letterSpacing: px(3), textTransform: 'uppercase', color: t.accent, fontWeight: 700 }}>
          Khula Cafe
        </span>
        <span style={{ fontSize: px(18) }}>{t.motif}</span>
      </div>

      <p style={{ margin: `0 0 ${px(6)}`, fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: px(30), lineHeight: 1.15, color: t.ink }}>
        {t.title}
      </p>

      {voucher.recipient_name && (
        <p style={{ margin: `0 0 ${px(18)}`, fontSize: px(14), color: `${t.ink}b3` }}>
          For <strong style={{ color: t.ink }}>{voucher.recipient_name}</strong>
        </p>
      )}

      {/* Value */}
      <div style={{
        display: 'inline-block', margin: `${px(6)} 0 ${px(20)}`,
        padding: `${px(12)} ${px(26)}`, borderRadius: px(14),
        border: `1px solid ${t.edge}`, background: 'rgba(0,0,0,0.25)',
      }}>
        <span style={{ fontFamily: 'var(--font-playfair), Georgia, serif', fontSize: px(42), fontWeight: 700, color: t.accent, lineHeight: 1 }}>
          {money(voucher.amount_cents)}
        </span>
      </div>

      {voucher.message && (
        <p style={{
          margin: `0 0 ${px(22)}`, fontSize: px(15), lineHeight: 1.7,
          color: `${t.ink}cc`, fontStyle: 'italic', whiteSpace: 'pre-wrap',
        }}>
          “{voucher.message}”
        </p>
      )}

      {voucher.sender_name && (
        <p style={{ margin: `0 0 ${px(22)}`, fontSize: px(14), color: `${t.ink}b3` }}>
          With love from <strong style={{ color: t.ink }}>{voucher.sender_name}</strong>
        </p>
      )}

      {/* Code */}
      <div style={{
        borderTop: `1px dashed ${t.edge}`, paddingTop: px(20), marginTop: px(4),
      }}>
        <p style={{ margin: `0 0 ${px(6)}`, fontSize: px(10), letterSpacing: px(2), textTransform: 'uppercase', color: `${t.ink}80` }}>
          Voucher code
        </p>
        <p style={{
          margin: `0 0 ${px(10)}`, fontSize: px(26), letterSpacing: px(4),
          fontWeight: 700, color: t.accent, wordBreak: 'break-all',
        }}>
          {voucher.code}
        </p>
        <p style={{ margin: 0, fontSize: px(12), color: `${t.ink}80`, lineHeight: 1.6 }}>
          Use this code at checkout or towards a booking deposit.
          {voucher.expires_at ? ` Valid until ${prettyDate(voucher.expires_at)}.` : ' No expiry date.'}
        </p>
      </div>
    </div>
  )
}
