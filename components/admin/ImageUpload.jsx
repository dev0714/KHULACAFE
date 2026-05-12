'use client'
import { useState } from 'react'

export default function ImageUpload({ value, onChange, folder = 'general' }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  async function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError('')

    const form = new FormData()
    form.append('file', file)
    form.append('folder', folder)

    const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error || 'Upload failed')
    } else {
      onChange(data.url)
    }
    setUploading(false)
  }

  return (
    <div>
      {value && (
        <img src={value} alt="preview" style={{
          width: '100%', maxHeight: '160px', objectFit: 'cover',
          borderRadius: '8px', marginBottom: '12px', display: 'block',
        }} />
      )}
      <label style={{
        display: 'inline-block', padding: '10px 20px', borderRadius: '8px',
        background: '#2e2000', border: '1px solid #3d2a00', cursor: 'pointer',
        fontSize: '12px', letterSpacing: '1px', color: '#f5c842',
      }}>
        {uploading ? 'Uploading…' : value ? 'Change Image' : 'Upload Image'}
        <input type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
      </label>
      {value && (
        <button type="button" onClick={() => onChange('')} style={{
          marginLeft: '8px', padding: '10px 16px', borderRadius: '8px',
          background: 'none', border: '1px solid #2e2000', cursor: 'pointer',
          fontSize: '12px', color: 'rgba(255,255,255,0.4)',
        }}>
          Remove
        </button>
      )}
      {error && <p style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '8px' }}>{error}</p>}
    </div>
  )
}
