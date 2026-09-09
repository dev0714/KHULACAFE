'use client'
import { useState } from 'react'
import { markMessageRead, deleteMessage } from './actions'
import { PageHeader, Card, Pill, Btn, Avatar, Icon, Empty } from '../../../components/admin/ui'

const CREATE_SQL = `CREATE TABLE IF NOT EXISTS "Khulacafe".contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);`

function when(iso, long = false) {
  return new Date(iso).toLocaleString('en-ZA', long
    ? { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function MessagesClient({ messages: initial, tableError }) {
  const [messages, setMessages] = useState(initial)
  const [selectedId, setSelectedId] = useState(initial[0]?.id ?? null)
  const [search, setSearch] = useState('')
  const [copied, setCopied] = useState(false)

  const selected = messages.find(m => m.id === selectedId) ?? null
  const unread = messages.filter(m => !m.is_read).length

  const filtered = messages.filter(m => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return m.name?.toLowerCase().includes(q) || m.email?.toLowerCase().includes(q) || m.message?.toLowerCase().includes(q)
  })

  async function open(m) {
    setSelectedId(m.id)
    if (!m.is_read) {
      await markMessageRead(m.id)
      setMessages(prev => prev.map(x => x.id === m.id ? { ...x, is_read: true } : x))
    }
  }
  async function handleMarkRead(id) {
    await markMessageRead(id)
    setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m))
  }
  async function markAllRead() {
    const ids = messages.filter(m => !m.is_read).map(m => m.id)
    await Promise.all(ids.map(markMessageRead))
    setMessages(prev => prev.map(m => ({ ...m, is_read: true })))
  }
  async function handleDelete(id) {
    if (!confirm('Delete this message?')) return
    await deleteMessage(id)
    setMessages(prev => {
      const next = prev.filter(m => m.id !== id)
      if (selectedId === id) setSelectedId(next[0]?.id ?? null)
      return next
    })
  }
  function copySQL() {
    navigator.clipboard.writeText(CREATE_SQL)
    setCopied(true); setTimeout(() => setCopied(false), 2000)
  }

  if (tableError) return (
    <>
      <PageHeader title="Messages" subtitle="Contact form enquiries from the website." />
      <Card style={{ padding: '28px', maxWidth: '640px', border: '1px solid var(--adm-gold2)' }}>
        <h2 style={{ color: 'var(--adm-gold)', fontSize: '16px', marginBottom: '8px' }}>One-time database setup required</h2>
        <p style={{ fontSize: '13px', color: 'var(--adm-muted)', marginBottom: '20px', lineHeight: 1.7 }}>
          The <code style={{ background: 'var(--adm-surface2)', padding: '2px 6px', borderRadius: '4px' }}>contact_messages</code> table doesn't exist yet.
          Run the SQL below in your <a href="https://supabase.com/dashboard/project/bjggovjpsyjoflblwiaj/editor" target="_blank" style={{ color: 'var(--adm-gold)' }}>Supabase SQL Editor</a>, then refresh.
        </p>
        <pre style={{ background: 'var(--adm-page)', border: '1px solid var(--adm-border)', borderRadius: '8px', padding: '16px', fontSize: '12px', color: 'var(--adm-text)', whiteSpace: 'pre-wrap', wordBreak: 'break-all', marginBottom: '12px' }}>{CREATE_SQL}</pre>
        <Btn variant="primary" onClick={copySQL}>{copied ? '✓ Copied' : 'Copy SQL'}</Btn>
      </Card>
    </>
  )

  return (
    <>
      <PageHeader
        title="Messages"
        subtitle={unread > 0 ? `${unread} unread · contact form enquiries from the website.` : 'Contact form enquiries from the website.'}
        actions={unread > 0 && <Btn onClick={markAllRead}>{Icon.check(16)} Mark all read</Btn>}
      />

      {messages.length === 0 ? (
        <Card><Empty>No messages yet — contact form submissions will appear here.</Empty></Card>
      ) : (
        <div className="admin-chart-grid" style={{ display: 'grid', gridTemplateColumns: '400px minmax(0, 1fr)', gap: '16px', alignItems: 'start' }}>
          {/* List */}
          <Card style={{ overflow: 'hidden' }}>
            <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--adm-border)' }}>
              <div className="adm-search" style={{ width: '100%' }}>
                <span className="adm-search-ico">{Icon.search(16)}</span>
                <input className="adm-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search messages…" />
              </div>
            </div>
            {filtered.length === 0 && <Empty>No matches.</Empty>}
            {filtered.map(m => {
              const sel = m.id === selectedId
              return (
                <div key={m.id} onClick={() => open(m)} className="adm-row" style={{
                  display: 'flex', gap: '12px', padding: '14px 16px', borderBottom: '1px solid var(--adm-border)', cursor: 'pointer',
                  background: sel ? 'var(--adm-gold-soft)' : 'transparent',
                }}>
                  <span className="adm-dot" style={{ background: m.is_read ? 'transparent' : 'var(--adm-gold)', width: '8px', height: '8px', marginTop: '6px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', minWidth: 0, flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: m.is_read ? 500 : 700, color: 'var(--adm-text)' }}>{m.name}</span>
                      <span style={{ fontSize: '11px', color: 'var(--adm-faint)', flexShrink: 0 }}>{when(m.created_at)}</span>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--adm-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.message}</span>
                  </div>
                </div>
              )
            })}
          </Card>

          {/* Detail */}
          {selected ? (
            <Card style={{ padding: '26px', display: 'flex', flexDirection: 'column', gap: '20px', position: 'sticky', top: '84px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <Avatar name={selected.name} size={44} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span style={{ fontFamily: 'var(--font-playfair)', fontSize: '22px', fontWeight: 700 }}>{selected.name}</span>
                    <span style={{ fontSize: '12px', color: 'var(--adm-muted)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <a href={`mailto:${selected.email}`} style={{ color: 'var(--adm-gold)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>{Icon.at(14)} {selected.email}</a>
                      {selected.phone && <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>{Icon.phone(14)} {selected.phone}</span>}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--adm-faint)' }}>{when(selected.created_at, true)}</span>
                  </div>
                </div>
                <Pill color={selected.is_read ? 'rgba(255,255,255,0.45)' : '#f5c842'}>{selected.is_read ? 'Read' : 'Unread'}</Pill>
              </div>

              <div style={{ padding: '20px', borderRadius: '12px', background: 'var(--adm-page)', border: '1px solid var(--adm-border)', fontSize: '14px', lineHeight: 1.8, color: 'rgba(255,255,255,0.85)', whiteSpace: 'pre-wrap' }}>
                {selected.message}
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <a href={`mailto:${selected.email}?subject=Re: Your message to Khula Cafe`} className="adm-btn adm-btn-primary">{Icon.mail(16)} Reply by email</a>
                {!selected.is_read && <Btn onClick={() => handleMarkRead(selected.id)}>Mark as read</Btn>}
                <div style={{ flex: 1 }} />
                <Btn variant="danger" onClick={() => handleDelete(selected.id)}>{Icon.trash(16)} Delete</Btn>
              </div>
            </Card>
          ) : (
            <Card><Empty>Select a message to read it.</Empty></Card>
          )}
        </div>
      )}
    </>
  )
}
