'use client'
import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'

const SIZE_PRESETS = [
  { label: 'Small', width: 400 },
  { label: 'Medium', width: 800 },
  { label: 'Large', width: 1200 },
  { label: 'Original', width: null },
]

function getCroppedBlob(imageSrc, pixelCrop, outputWidth) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => {
      const srcW = pixelCrop.width
      const srcH = pixelCrop.height
      const scale = outputWidth && outputWidth < srcW ? outputWidth / srcW : 1
      const canvas = document.createElement('canvas')
      canvas.width = Math.round(srcW * scale)
      canvas.height = Math.round(srcH * scale)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(
        image,
        pixelCrop.x, pixelCrop.y,
        srcW, srcH,
        0, 0,
        canvas.width, canvas.height
      )
      canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Canvas is empty')), 'image/jpeg', 0.92)
    }
    image.onerror = reject
    image.src = imageSrc
  })
}

export default function ImageUpload({ value, onChange, folder = 'general', aspect }) {
  const [rawSrc, setRawSrc] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [outputWidth, setOutputWidth] = useState(800)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  function getOutputDims() {
    if (!croppedAreaPixels) return null
    const srcW = croppedAreaPixels.width
    const srcH = croppedAreaPixels.height
    const scale = outputWidth && outputWidth < srcW ? outputWidth / srcW : 1
    return { w: Math.round(srcW * scale), h: Math.round(srcH * scale) }
  }

  function openCropFromFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => openCropModal(reader.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function openCropModal(src) {
    setRawSrc(src)
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setError('')
  }

  const onCropComplete = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels)
  }, [])

  async function handleConfirm() {
    if (!croppedAreaPixels) return
    setUploading(true)
    setError('')
    try {
      const blob = await getCroppedBlob(rawSrc, croppedAreaPixels, outputWidth)
      const form = new FormData()
      form.append('file', blob, `crop-${Date.now()}.jpg`)
      form.append('folder', folder)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Upload failed')
      } else {
        onChange(data.url)
        setRawSrc(null)
      }
    } catch {
      setError('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  function handleCancel() {
    setRawSrc(null)
    setError('')
  }

  return (
    <div>
      {/* ── Crop modal ── */}
      {rawSrc && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(6px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '24px',
        }}>
          <div style={{
            background: '#1e1500', border: '1px solid #2e2000', borderRadius: '16px',
            width: '100%', maxWidth: '560px', overflow: 'hidden',
          }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #2e2000', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: '#f5c842', fontSize: '14px', letterSpacing: '2px', textTransform: 'uppercase', margin: 0 }}>
                Crop & Zoom
              </h3>
              <button onClick={handleCancel} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>✕</button>
            </div>

            <div style={{ position: 'relative', width: '100%', height: '340px', background: '#0a0600' }}>
              <Cropper
                image={rawSrc}
                crop={crop}
                zoom={zoom}
                aspect={aspect}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
                style={{
                  containerStyle: { background: '#0a0600' },
                  cropAreaStyle: { border: '2px solid #f5c842', boxShadow: '0 0 0 9999px rgba(10,6,0,0.65)' },
                }}
              />
            </div>

            <div style={{ padding: '16px 24px', borderTop: '1px solid #2e2000' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', flexShrink: 0 }}>Size</span>
                {SIZE_PRESETS.map(p => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setOutputWidth(p.width)}
                    style={{
                      padding: '5px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                      fontSize: '11px', fontWeight: 600, letterSpacing: '0.5px',
                      background: outputWidth === p.width ? 'linear-gradient(135deg, #f5c842, #c8940c)' : '#2e2000',
                      color: outputWidth === p.width ? '#0a0600' : 'rgba(255,255,255,0.6)',
                    }}
                  >
                    {p.label}{p.width ? ` ${p.width}px` : ''}
                  </button>
                ))}
              </div>
              {(() => {
                const dims = getOutputDims()
                return dims ? (
                  <p style={{ fontSize: '11px', color: '#26de81', marginBottom: '12px', letterSpacing: '0.5px' }}>
                    ✓ Will save as {dims.w} × {dims.h} px
                  </p>
                ) : (
                  <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginBottom: '12px' }}>
                    Drag to position your crop
                  </p>
                )
              })()}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', width: '36px' }}>Zoom</span>
                <input
                  type="range" min={1} max={3} step={0.01} value={zoom}
                  onChange={e => setZoom(Number(e.target.value))}
                  style={{ flex: 1, accentColor: '#f5c842', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '11px', color: '#f5c842', width: '32px', textAlign: 'right' }}>{zoom.toFixed(1)}×</span>
              </div>

              {error && <p style={{ color: '#ff6b6b', fontSize: '12px', marginBottom: '12px' }}>{error}</p>}

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button onClick={handleCancel} style={{
                  padding: '10px 20px', borderRadius: '8px', border: '1px solid #2e2000',
                  background: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '12px',
                }}>
                  Cancel
                </button>
                <button onClick={handleConfirm} disabled={uploading} style={{
                  padding: '10px 24px', borderRadius: '8px', border: 'none',
                  background: 'linear-gradient(135deg, #f5c842, #c8940c)',
                  color: '#0a0600', fontWeight: 700, fontSize: '12px',
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  opacity: uploading ? 0.7 : 1, letterSpacing: '1px',
                }}>
                  {uploading ? 'Uploading…' : (() => { const d = getOutputDims(); return d ? `Save ${d.w}×${d.h}` : 'Save Image' })()}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Current image preview + Re-crop ── */}
      {value && !rawSrc && (
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <img src={value} alt="preview" style={{
            width: '100%', maxHeight: '200px', objectFit: 'cover',
            borderRadius: '8px', display: 'block',
          }} />
          {/* Re-crop overlay button */}
          <button
            type="button"
            onClick={() => openCropModal(value)}
            style={{
              position: 'absolute', top: '8px', right: '8px',
              background: 'rgba(10,6,0,0.75)', backdropFilter: 'blur(6px)',
              border: '1px solid rgba(245,200,66,0.4)', borderRadius: '6px',
              color: '#f5c842', fontSize: '11px', letterSpacing: '1px',
              padding: '5px 10px', cursor: 'pointer',
            }}
          >
            ✂ Re-crop
          </button>
        </div>
      )}

      {/* ── Upload / change buttons ── */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <label style={{
          display: 'inline-block', padding: '10px 20px', borderRadius: '8px',
          background: '#2e2000', border: '1px solid #3d2a00', cursor: 'pointer',
          fontSize: '12px', letterSpacing: '1px', color: '#f5c842',
        }}>
          {value ? 'Change Image' : 'Upload Image'}
          <input type="file" accept="image/*" onChange={openCropFromFile} style={{ display: 'none' }} />
        </label>
        {value && (
          <button type="button" onClick={() => onChange('')} style={{
            padding: '10px 16px', borderRadius: '8px',
            background: 'none', border: '1px solid #2e2000', cursor: 'pointer',
            fontSize: '12px', color: 'rgba(255,255,255,0.4)',
          }}>
            Remove
          </button>
        )}
      </div>

      {error && !rawSrc && <p style={{ color: '#ff6b6b', fontSize: '12px', marginTop: '8px' }}>{error}</p>}
    </div>
  )
}
