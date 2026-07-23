// Pure helpers + defaults for the site's contact details. Safe to import from
// both server and client code (no server-only deps).

export const DEFAULT_CONTACT = {
  address: 'Dickswell Centre, Cnr Old Main Road, Unit DC2, St Johns Ave, Pinetown, Durban, 3610',
  phone: '061 489 4615',
  email: 'bookings@khulacafe.co.za',
  whatsapp: '27614894615',
  trading_hours: [
    { day: 'Monday – Thursday', hours: '08:00 – 21:00' },
    { day: 'Friday – Saturday', hours: '08:00 – 23:00' },
    { day: 'Sunday', hours: '09:00 – 20:00' },
    { day: 'Public Holidays', hours: '09:00 – 18:00' },
  ],
  instagram: 'khulacafe',
  tiktok: 'khulacafe',
  facebook: 'khulacafe',
}

export function telHref(phone) {
  const digits = (phone || '').replace(/[^0-9+]/g, '')
  return digits ? `tel:${digits}` : null
}

export function waHref(whatsapp, text = 'Hi Khula Cafe 👋') {
  const digits = (whatsapp || '').replace(/[^0-9]/g, '')
  if (!digits) return null
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
}

export function mailtoHref(email) {
  return email ? `mailto:${email.trim()}` : null
}

export function mapsHref(address) {
  return address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : null
}

// Accepts a full URL or a handle (with/without @) and returns a profile URL.
export function socialUrl(platform, value) {
  if (!value) return null
  const v = value.trim()
  if (!v) return null
  if (/^https?:\/\//i.test(v)) return v
  const handle = v.replace(/^@+/, '')
  if (!handle) return null
  switch (platform) {
    case 'instagram': return `https://instagram.com/${handle}`
    case 'tiktok': return `https://www.tiktok.com/@${handle}`
    case 'facebook': return `https://facebook.com/${handle}`
    default: return null
  }
}
