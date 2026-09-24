// Trading hours per weekday (0 = Sunday), in South African time.
// Safe to import from both client and server code.
export const HOURS = {
  0: null,                 // Sunday — closed
  1: null,                 // Monday — closed
  2: ['08:00', '17:00'],
  3: ['08:00', '17:00'],
  4: ['08:00', '17:00'],
  5: ['08:00', '19:00'],
  6: ['08:00', '19:00'],
}

// Deliveries stop this many minutes before closing so the driver is back
// before we shut. Collections can run right up to closing.
export const DELIVERY_CUTOFF_MIN = 30

export const ASAP = 'As soon as possible'

const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m }
const toHHMM = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`

// Day of week and minutes since midnight in Johannesburg, whatever the
// server's or browser's own time zone happens to be.
export function nowInSA(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Johannesburg', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false,
  }).formatToParts(date)
  const get = (t) => parts.find(p => p.type === t)?.value
  const day = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday'))
  const minutes = (Number(get('hour')) % 24) * 60 + Number(get('minute'))
  return { day, minutes }
}

// The half-hour slots a customer may pick today for pickup or delivery.
// Slots already in the past are left out.
export function slotsFor(type, date = new Date()) {
  const { day, minutes } = nowInSA(date)
  const hours = HOURS[day]
  if (!hours) return { open: false, slots: [], asap: false, last: null, close: null }

  const openAt = toMin(hours[0])
  const closeAt = toMin(hours[1])
  const lastAt = type === 'delivery' ? closeAt - DELIVERY_CUTOFF_MIN : closeAt

  const slots = []
  for (let t = openAt; t <= lastAt; t += 30) if (t > minutes) slots.push(toHHMM(t))

  return {
    open: true,
    slots,
    // "As soon as possible" only makes sense while there is still time left today.
    asap: minutes >= openAt && minutes < lastAt,
    last: toHHMM(lastAt),
    close: hours[1],
  }
}

// Server-side check that a requested time is still allowed.
export function isAllowedTime(type, wanted, date = new Date()) {
  if (!wanted) return false
  const { slots, asap } = slotsFor(type, date)
  if (wanted === ASAP) return asap
  return slots.includes(wanted)
}
