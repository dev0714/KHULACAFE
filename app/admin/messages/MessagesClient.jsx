'use client'
import { useState } from 'react'
import { markMessageRead, deleteMessage } from './actions'

const CREATE_SQL = `CREATE TABLE IF NOT EXISTS "Khulacafe".contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);`

export default function MessagesClient({ messages: initial, tableError }) {
  const [messages, setMessages] = useState(initial)
  const [selected, setSelected] = useState(null)
  const [copied, setCopied] = useState(false)

  async function handleMarkRead(id) {
    await markMessageRead(id)
    setMessages(prev => prev.map(m => m.id === id ? { ...m, is_read: true } : m))
    if (selected?.id === id) setSelected(s => ({ ...s, is_read: true }))
  }

  async function handleDelete(id) {
    if (!confirm('Delete this message?')) return
    await deleteMessage(id)
    setMessages(prev => prev.filter(m => m.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  function copySQL() {
    navigator.clipboard.writeText(CREATE_SQL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const unread = messages.filter(m => !m.is_read).length

  if (tableError) return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '28px', color: '#fafafa', marginBottom: '8px' }}>Messages</h1>
      <div style={{ background: '#1e1500', border: '1px solid #c8940c', borderRadius: '14px', padding: '28px', maxWidth: '640px', marginTop: '24px' }}>
        <div style={{ fontSize: '28px', marginBottom: '12px' }}>⚠️</div>
        <h2 style={{ color: '#f5c842', fontSize: '16px', marginBottom: '8px' }}>One-time database setup required</h2>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.6)', marginBottom: '20px', lineHeight: 1.7 }}>
          The <code style={{ background: '#2e2000', padding: '2px 6px', borderRadius: '4px' }}>contact_messages</code> table doesn't exist yet.
          Run the SQL below in your <a href="https://supabase.com/dashboard/project/bjggovjpsyjoflblwiaj/editor" target="_blank" style={{ color: '#f5c842' }}>Supabase SQL Editor</a>, then refresh this page.
        </p>
        <pre style={{
          background: '#0a0600', border: '1px solid #2e2000', borderRadius: '8px',
          padding: '16px', fontSize: '12px', color: '#fafafa', whiteSpace: 'pre-wrap',
          wordBreak: 'break-all', marginBottom: '12px',
        }}>{CREATE_SQL}</pre>
        <button onClick={copySQL} style={{
          padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
          background: copied ? '#166534' : 'linear-gradient(135deg, #f5c842, #c8940c)',
          color: copied ? '#fff' : '#0a0600', fontWeight: 600, fontSize: '13px',
        }}>
          {copied ? '✓ Copied!' : 'Copy SQL'}
        </button>
      </div>
    </div>
  )

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <h1 style={{ fontFamily: 'var(--font-playfair)', fontSize: '28px', color: '#fafafa', margin: 0 }}>Messages</h1>
        {unread > 0 && (
          <span style={{ background: '#f5c842', color: '#0a0600', borderRadius: '20px', padding: '3px 12px', fontSize: '12px', fontWeight: 700 }}>
            {unread} unread
          </span>
        )}
      </div>

      {messages.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '80px 24px', color: 'rgba(255,255,255,0.3)' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>✉️</div>
          <p style={{ fontSize: '16px' }}>No messages yet</p>
          <p style={{ fontSize: '13px', marginTop: '8px' }}>Contact form submissions will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: '20px', alignItems: 'start' }}>

          {/* Message list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {messages.map(msg => (
              <div
                key={msg.id}
                onClick={() => { setSelected(msg); if (!msg.is_read) handleMarkRead(msg.id) }}
                style={{
                  background: selected?.id === msg.id ? '#2e2000' : '#1e1500',
                  border: `1px solid ${selected?.id === msg.id ? '#c8940c' : msg.is_read ? '#2e2000' : '#c8940c44'}`,
                  borderRadius: '12px', padding: '16px 18px', cursor: 'pointer',
                  transition: 'all 0.15s',
                  position: 'relative',
                }}
              >
                {!msg.is_read && (
                  <span style={{
                    position: 'absolute', top: '16px', right: '16px',
                    width: '8px', height: '8px', borderRadius: '50%', background: '#f5c842',
                  }} />
                )}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 700, fontSize: '14px', color: '#fafafa' }}>{msg.name}</span>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.35)' }}>
                    {new Date(msg.created_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#f5c842', marginBottom: '6px' }}>{msg.email}</div>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {msg.message}
                </p>
              </div>
            ))}
          </div>

          {/* Detail panel */}
          {selected && (
            <div style={{ background: '#1e1500', border: '1px solid #2e2000', borderRadius: '14px', padding: '24px', position: 'sticky', top: '20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-playfair)', fontSize: '20px', color: '#fafafa', margin: '0 0 4px' }}>{selected.name}</h2>
                  <a href={`mailto:${selected.email}`} style={{ fontSize: '13px', color: '#f5c842', textDecoration: 'none' }}>{selected.email}</a>
                  {selected.phone && (
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginTop: '2px' }}>{selected.phone}</div>
                  )}
                </div>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '20px', lineHeight: 1, padding: '4px' }}>✕</button>
              </div>

              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', marginBottom: '16px', letterSpacing: '1px', textTransform: 'uppercase' }}>
                {new Date(selected.created_at).toLocaleString('en-ZA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>

              <div style={{ background: '#2e2000', borderRadius: '10px', padding: '18px', marginBottom: '20px' }}>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.8)', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap' }}>{selected.message}</p>
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <a
                  href={`mailto:${selected.email}?subject=Re: Your message to Khula Cafe`}
                  style={{
                    padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    background: 'linear-gradient(135deg, #f5c842, #c8940c)',
                    color: '#0a0600', fontWeight: 700, fontSize: '12px',
                    textDecoration: 'none', display: 'inline-block',
                  }}
                >
                  Reply via Email
                </a>
                {!selected.is_read && (
                  <button onClick={() => handleMarkRead(selected.id)} style={{
                    padding: '10px 18px', borderRadius: '8px', border: '1px solid #2e2000',
                    background: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '12px',
                  }}>
                    Mark as Read
                  </button>
                )}
                <button onClick={() => handleDelete(selected.id)} style={{
                  padding: '10px 18px', borderRadius: '8px', border: '1px solid #3d1515',
                  background: 'none', color: 'rgba(248,113,113,0.7)', cursor: 'pointer', fontSize: '12px', marginLeft: 'auto',
                }}>
                  Delete
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
