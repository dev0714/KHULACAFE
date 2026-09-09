'use client'
// Shared admin UI primitives — the visual vocabulary of the redesigned admin.
// Tokens live in globals.css under "Admin design system".

const svg = (paths, size = 18) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"
    strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} dangerouslySetInnerHTML={{ __html: paths }} />
)

export const Icon = {
  grid: (s) => svg('<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>', s),
  receipt: (s) => svg('<path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6"/>', s),
  calendar: (s) => svg('<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>', s),
  mail: (s) => svg('<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>', s),
  utensils: (s) => svg('<path d="M7 3v8a3 3 0 0 0 3 3v7M7 3v5M10 3v5M17 3c-2 1-3 3-3 6v3h3v9"/>', s),
  image: (s) => svg('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-8 8"/>', s),
  pin: (s) => svg('<path d="M12 21s7-6 7-11a7 7 0 0 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>', s),
  users: (s) => svg('<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4a3.5 3.5 0 0 1 0 7M21.5 20a6.5 6.5 0 0 0-5-6.3"/>', s),
  coin: (s) => svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5c0-1 1-2 2.5-2s2.5 1 2.5 2-1 1.7-2.5 2-2.5 1-2.5 2 1 2 2.5 2 2.5-1 2.5-2"/>', s),
  ticket: (s) => svg('<path d="M3 9a2 2 0 0 0 2-2V5h14v2a2 2 0 0 0 0 4v2a2 2 0 0 0 0 4v2H5v-2a2 2 0 0 0-2-2z"/><path d="M13 5v14"/>', s),
  card: (s) => svg('<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/>', s),
  settings: (s) => svg('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>', s),
  key: (s) => svg('<circle cx="8" cy="15" r="4"/><path d="M10.9 12.1L21 2M15 8l3 3M18 5l3 3"/>', s),
  search: (s) => svg('<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>', s),
  bell: (s) => svg('<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21a2 2 0 0 0 4 0"/>', s),
  plus: (s) => svg('<path d="M12 5v14M5 12h14"/>', s),
  ext: (s) => svg('<path d="M14 4h6v6M20 4l-9 9"/><path d="M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5"/>', s),
  more: (s) => svg('<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>', s),
  chev: (s) => svg('<path d="M9 6l6 6-6 6"/>', s),
  check: (s) => svg('<path d="M5 12l4 4L19 6"/>', s),
  clock: (s) => svg('<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', s),
  logout: (s) => svg('<path d="M10 17l5-5-5-5M15 12H3M13 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"/>', s),
  menu: (s) => svg('<path d="M4 7h16M4 12h16M4 17h16"/>', s),
  x: (s) => svg('<path d="M6 6l12 12M18 6L6 18"/>', s),
  refresh: (s) => svg('<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v5h-5"/>', s),
  phone: (s) => svg('<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>', s),
  at: (s) => svg('<circle cx="12" cy="12" r="4"/><path d="M16 12v1.5a2.5 2.5 0 0 0 5 0V12a9 9 0 1 0-3.5 7.1"/>', s),
  truck: (s) => svg('<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>', s),
  home: (s) => svg('<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>', s),
  trash: (s) => svg('<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>', s),
  edit: (s) => svg('<path d="M4 20h4l10-10-4-4L4 16z"/><path d="M13 7l4 4"/>', s),
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="adm-page-header">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: 0 }}>
        <h1 className="adm-h1">{title}</h1>
        {subtitle && <p className="adm-subtitle">{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', flexShrink: 0 }}>{actions}</div>}
    </div>
  )
}

export function Pill({ color = '#f5c842', children, style }) {
  return (
    <span className="adm-pill" style={{ background: `${color}1f`, color, ...style }}>
      <span className="adm-dot" style={{ background: color }} />
      {children}
    </span>
  )
}

export function KpiTile({ label, value, hint, color }) {
  return (
    <div className="adm-card adm-kpi">
      <span className="adm-th">{label}</span>
      <span className="adm-kpi-value" style={color ? { color } : undefined}>{value}</span>
      {hint && <span className="adm-kpi-hint">{hint}</span>}
    </div>
  )
}

export function Card({ children, className = '', style, ...rest }) {
  return <div className={`adm-card ${className}`} style={style} {...rest}>{children}</div>
}

export function Btn({ variant = 'ghost', children, style, ...rest }) {
  return (
    <button className={`adm-btn adm-btn-${variant}`} style={style} {...rest}>{children}</button>
  )
}

export function Tabs({ items, value, onChange }) {
  return (
    <div className="adm-tabs">
      {items.map(t => (
        <button key={t.key} type="button" onClick={() => onChange(t.key)}
          className={`adm-tab${value === t.key ? ' active' : ''}`}>
          {t.label}{t.count != null && <span className="adm-tab-count">{t.count}</span>}
        </button>
      ))}
    </div>
  )
}

export function Avatar({ name, size = 36 }) {
  const initials = (name || '?').split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
  return (
    <div className="adm-avatar" style={{ width: size, height: size, fontSize: Math.round(size * 0.33) }}>{initials}</div>
  )
}

export function Empty({ children }) {
  return <div className="adm-empty">{children}</div>
}
