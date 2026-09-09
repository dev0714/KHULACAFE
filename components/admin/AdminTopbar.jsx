'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { ALL_NAV } from './AdminSidebar'
import { Icon } from './ui'
import { getUnreadMessageCount } from '../../app/admin/messages/actions'

export default function AdminTopbar() {
  const pathname = usePathname()
  const router = useRouter()
  const [q, setQ] = useState('')
  const [openMenu, setOpenMenu] = useState(false)
  const [unread, setUnread] = useState(0)
  const boxRef = useRef(null)

  const current = ALL_NAV.find(i => i.exact ? pathname === i.href : pathname.startsWith(i.href))
  const crumb = current?.label ?? 'Admin'

  useEffect(() => {
    getUnreadMessageCount().then(setUnread).catch(() => {})
  }, [pathname])

  useEffect(() => {
    const onDoc = (e) => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpenMenu(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const matches = q.trim()
    ? ALL_NAV.filter(i => i.label.toLowerCase().includes(q.trim().toLowerCase())).slice(0, 6)
    : []

  function go(item) {
    setQ(''); setOpenMenu(false)
    router.push(item.href)
  }

  return (
    <div className="adm-topbar adm-top-in">
      <div className="adm-crumb">Admin <span style={{ display: 'flex' }}>{Icon.chev(14)}</span> <b>{crumb}</b></div>
      <div style={{ flex: 1 }} />

      {/* Quick jump */}
      <div className="adm-search" ref={boxRef}>
        <span className="adm-search-ico">{Icon.search(16)}</span>
        <input
          className="adm-input" value={q} placeholder="Jump to a section…"
          onChange={e => { setQ(e.target.value); setOpenMenu(true) }}
          onFocus={() => setOpenMenu(true)}
          onKeyDown={e => { if (e.key === 'Enter' && matches[0]) go(matches[0]); if (e.key === 'Escape') setOpenMenu(false) }}
        />
        {openMenu && matches.length > 0 && (
          <div className="adm-search-menu">
            {matches.map((m, i) => (
              <a key={m.href} href={m.href} className={i === 0 ? 'hi' : ''} onClick={e => { e.preventDefault(); go(m) }}>
                {Icon[m.icon](16)}<span>{m.label}</span>
              </a>
            ))}
          </div>
        )}
      </div>

      <Link href="/admin/messages" className="adm-iconbtn" aria-label="Messages" title={unread ? `${unread} unread message${unread > 1 ? 's' : ''}` : 'Messages'}>
        {Icon.bell(18)}
        {unread > 0 && <span className="adm-ping" />}
      </Link>
      <Link href="/" target="_blank" className="adm-btn adm-btn-ghost">{Icon.ext(16)} View site</Link>
    </div>
  )
}
