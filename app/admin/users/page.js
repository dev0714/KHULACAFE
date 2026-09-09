'use client'
import { useState, useEffect, useCallback } from 'react'
import { getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser } from '../actions'
import { PageHeader, Card, Btn, Avatar, Icon, Empty } from '../../../components/admin/ui'

const blank = { name: '', email: '', password: '', confirm: '' }

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => { setUsers(await getAdminUsers()); setLoading(false) }, [])
  useEffect(() => { load() }, [load])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  function startEdit(user) { setEditing(user); setForm({ name: user.name, email: user.email, password: '', confirm: '' }); setError(''); setSuccess('') }
  function cancelEdit() { setEditing(null); setForm(blank); setError('') }

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    if (!form.name.trim() || !form.email.trim()) { setError('Name and email are required.'); return }
    if (!editing && !form.password) { setError('Password is required for new users.'); return }
    if (form.password && form.password !== form.confirm) { setError('Passwords do not match.'); return }
    if (form.password && form.password.length < 8) { setError('Password must be at least 8 characters.'); return }
    setSaving(true)
    try {
      if (editing) { await updateAdminUser(editing.id, form.name, form.email, form.password || null); setSuccess('User updated.') }
      else { await createAdminUser(form.name, form.email, form.password); setSuccess('User created.') }
      setEditing(null); setForm(blank)
      await load()
    } catch (err) { setError(err.message) }
    setSaving(false)
  }

  async function handleDelete(user) {
    if (!confirm(`Remove ${user.name}? This cannot be undone.`)) return
    try { await deleteAdminUser(user.id); await load() } catch (err) { setError(err.message) }
  }

  return (
    <>
      <PageHeader title="Staff Users" subtitle="Who can sign in to this admin." />

      <div className="admin-chart-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 380px', gap: '16px', alignItems: 'start' }}>
        <Card style={{ overflow: 'hidden' }}>
          <div className="adm-table-head" style={{ gridTemplateColumns: 'minmax(0,1fr) auto' }}>
            <span className="adm-th">Admin accounts · {users.length}</span><span />
          </div>
          {loading && <Empty>Loading…</Empty>}
          {!loading && users.length === 0 && <Empty>No users found.</Empty>}
          {users.map(user => (
            <div key={user.id} className="adm-table-row adm-row" style={{ gridTemplateColumns: 'minmax(0,1fr) auto', background: editing?.id === user.id ? 'var(--adm-gold-soft)' : 'transparent' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <Avatar name={user.name} />
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>{user.name}</span>
                  <span style={{ fontSize: '12px', color: 'var(--adm-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Btn className="adm-btn-sm" onClick={() => startEdit(user)}>{Icon.edit(14)} Edit</Btn>
                <Btn variant="danger" className="adm-btn-sm" onClick={() => handleDelete(user)}>{Icon.trash(14)} Remove</Btn>
              </div>
            </div>
          ))}
        </Card>

        <Card style={{ padding: '24px', position: 'sticky', top: '84px' }}>
          <p className="adm-th" style={{ marginBottom: '18px' }}>{editing ? `Edit — ${editing.name}` : 'Add new user'}</p>
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div><label className="adm-label">Full name</label><input className="adm-input" value={form.name} onChange={e => set('name', e.target.value)} /></div>
            <div><label className="adm-label">Email</label><input className="adm-input" type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            <div><label className="adm-label">{editing ? 'New password (leave blank to keep)' : 'Password'}</label><input className="adm-input" type="password" value={form.password} onChange={e => set('password', e.target.value)} /></div>
            {form.password && <div><label className="adm-label">Confirm password</label><input className="adm-input" type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)} /></div>}
            {error && <p style={{ color: 'var(--adm-red)', fontSize: '12px', margin: 0 }}>{error}</p>}
            {success && <p style={{ color: 'var(--adm-green)', fontSize: '12px', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>{Icon.check(14)} {success}</p>}
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <Btn variant="primary" type="submit" disabled={saving} style={{ flex: 1 }}>{saving ? 'Saving…' : editing ? 'Save changes' : 'Create user'}</Btn>
              {editing && <Btn type="button" onClick={cancelEdit}>Cancel</Btn>}
            </div>
          </form>
        </Card>
      </div>
    </>
  )
}
