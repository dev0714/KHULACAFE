'use client'
import { useState, useEffect, useCallback } from 'react'
import { getAdminUsers, createAdminUser, updateAdminUser, deleteAdminUser } from '../actions'

const blank = { name: '', email: '', password: '', confirm: '' }

export default function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(blank)
  const [editing, setEditing] = useState(null) // user object being edited
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = useCallback(async () => {
    const data = await getAdminUsers()
    setUsers(data)
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })) }

  function startEdit(user) {
    setEditing(user)
    setForm({ name: user.name, email: user.email, password: '', confirm: '' })
    setError('')
    setSuccess('')
  }

  function cancelEdit() {
    setEditing(null)
    setForm(blank)
    setError('')
  }

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    if (!form.name.trim() || !form.email.trim()) { setError('Name and email are required.'); return }
    if (!editing && !form.password) { setError('Password is required for new users.'); return }
    if (form.password && form.password !== form.confirm) { setError('Passwords do not match.'); return }
    if (form.password && form.password.length < 8) { setError('Password must be at least 8 characters.'); return }

    setSaving(true)
    try {
      if (editing) {
        await updateAdminUser(editing.id, form.name, form.email, form.password || null)
        setSuccess('User updated.')
      } else {
        await createAdminUser(form.name, form.email, form.password)
        setSuccess('User created.')
      }
      setEditing(null)
      setForm(blank)
      await load()
    } catch (err) {
      setError(err.message)
    }
    setSaving(false)
  }

  async function handleDelete(user) {
    if (!confirm(`Remove ${user.name}? This cannot be undone.`)) return
    try {
      await deleteAdminUser(user.id)
      await load()
    } catch (err) {
      setError(err.message)
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', boxSizing: 'border-box',
    background: '#140e00', border: '1px solid #2e2000', borderRadius: '8px',
    color: '#fafafa', fontSize: '13px', outline: 'none',
  }
  const labelStyle = {
    display: 'block', fontSize: '10px', letterSpacing: '2px',
    color: '#f5c842', marginBottom: '5px', textTransform: 'uppercase',
  }

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-playfair)', color: '#fafafa', fontSize: '28px', margin: 0 }}>User Management</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>

        {/* User list */}
        <div style={{ background: '#1e1500', borderRadius: '14px', border: '1px solid #2e2000', overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px', borderBottom: '1px solid #2e2000' }}>
            <p style={{ fontSize: '10px', letterSpacing: '3px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', margin: 0 }}>
              Admin Accounts — {users.length}
            </p>
          </div>

          {loading && (
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '13px', padding: '24px 20px' }}>Loading…</p>
          )}

          {!loading && users.length === 0 && (
            <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '13px', padding: '24px 20px' }}>No users found.</p>
          )}

          {users.map(user => (
            <div key={user.id} style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderBottom: '1px solid #2e200055',
            }}>
              <div>
                <p style={{ color: '#fafafa', fontWeight: 600, fontSize: '14px', margin: '0 0 2px' }}>{user.name}</p>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', margin: 0 }}>{user.email}</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => startEdit(user)} style={{
                  padding: '6px 14px', borderRadius: '6px', border: '1px solid #2e2000',
                  background: 'transparent', color: '#f5c842', fontSize: '11px', cursor: 'pointer',
                }}>
                  Edit
                </button>
                <button onClick={() => handleDelete(user)} style={{
                  padding: '6px 14px', borderRadius: '6px', border: '1px solid #3a1500',
                  background: 'transparent', color: '#ff6b6b', fontSize: '11px', cursor: 'pointer',
                }}>
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <div style={{ background: '#1e1500', borderRadius: '14px', border: '1px solid #2e2000', padding: '24px' }}>
          <p style={{ fontSize: '10px', letterSpacing: '3px', color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', margin: '0 0 20px' }}>
            {editing ? 'Edit User' : 'Add New User'}
          </p>

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={labelStyle}>Full Name</label>
              <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)}
                onFocus={e => e.target.style.borderColor = '#f5c842'}
                onBlur={e => e.target.style.borderColor = '#2e2000'} />
            </div>

            <div>
              <label style={labelStyle}>Email</label>
              <input style={inputStyle} type="email" value={form.email} onChange={e => set('email', e.target.value)}
                onFocus={e => e.target.style.borderColor = '#f5c842'}
                onBlur={e => e.target.style.borderColor = '#2e2000'} />
            </div>

            <div>
              <label style={labelStyle}>{editing ? 'New Password (leave blank to keep)' : 'Password'}</label>
              <input style={inputStyle} type="password" value={form.password} onChange={e => set('password', e.target.value)}
                onFocus={e => e.target.style.borderColor = '#f5c842'}
                onBlur={e => e.target.style.borderColor = '#2e2000'} />
            </div>

            {form.password && (
              <div>
                <label style={labelStyle}>Confirm Password</label>
                <input style={inputStyle} type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)}
                  onFocus={e => e.target.style.borderColor = '#f5c842'}
                  onBlur={e => e.target.style.borderColor = '#2e2000'} />
              </div>
            )}

            {error && <p style={{ color: '#ff6b6b', fontSize: '12px', margin: 0 }}>{error}</p>}
            {success && <p style={{ color: '#26de81', fontSize: '12px', margin: 0 }}>{success}</p>}

            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
              <button type="submit" disabled={saving} style={{
                flex: 1, padding: '11px', borderRadius: '8px', border: 'none',
                background: saving ? '#2e2000' : 'linear-gradient(135deg, #f5c842, #c8940c)',
                color: saving ? 'rgba(255,255,255,0.4)' : '#0a0600',
                fontWeight: 700, fontSize: '11px', letterSpacing: '1.5px',
                textTransform: 'uppercase', cursor: saving ? 'not-allowed' : 'pointer',
              }}>
                {saving ? '…' : editing ? 'Save Changes' : 'Create User'}
              </button>
              {editing && (
                <button type="button" onClick={cancelEdit} style={{
                  padding: '11px 16px', borderRadius: '8px', border: '1px solid #2e2000',
                  background: 'transparent', color: 'rgba(255,255,255,0.4)',
                  fontSize: '11px', cursor: 'pointer',
                }}>
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
