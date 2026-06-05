'use client'
import { useState, useRef, useCallback } from 'react'
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

const SIZE_PRESETS = [
  { label: 'Small', width: 400 },
  { label: 'Medium', width: 800 },
  { label: 'Large', width: 1200 },
  { label: 'Original', width: null },
]

function getCroppedBlob(imgEl, crop, outputWidth) {
  return new Promise((resolve, reject) => {
    try {
      const canvas = document.createElement('canvas')
      const scaleX = imgEl.naturalWidth / imgEl.width
      const scaleY = imgEl.naturalHeight / imgEl.height

      // react-image-crop initial state uses '%' unit; onChange gives 'px'
      const isPct = crop.unit === '%'
      const cropX = isPct ? (crop.x / 100) * imgEl.width : crop.x
      const cropY = isPct ? (crop.y / 100) * imgEl.height : crop.y
      const cropW = isPct ? (crop.width / 100) * imgEl.width : crop.width
      const cropH = isPct ? (crop.height / 100) * imgEl.height : crop.height

      const srcW = cropW * scaleX
      const srcH = cropH * scaleY

      if (!srcW || !srcH) {
        reject(new Error('Crop area is too small — resize the handles and try again'))
        return
      }

      const scale = outputWidth && outputWidth < srcW ? outputWidth / srcW : 1
      canvas.width = Math.round(srcW * scale)
      canvas.height = Math.round(srcH * scale)

      const ctx = canvas.getContext('2d')
      ctx.drawImage(imgEl, cropX * scaleX, cropY * scaleY, srcW, srcH, 0, 0, canvas.width, canvas.height)

      // toDataURL is more reliable than toBlob across browsers
      const dataUrl = canvas.toDataURL('image/jpeg', 0.92)
      if (!dataUrl || dataUrl === 'data:,') {
        reject(new Error('Failed to process image — canvas may be empty'))
        return
      }
      const byteString = atob(dataUrl.split(',')[1])
      const ab = new ArrayBuffer(byteString.length)
      const ia = new Uint8Array(ab)
      for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i)
      resolve(new Blob([ab], { type: 'image/jpeg' }))
    } catch (err) {
      reject(err)
    }
  })
}

function initCrop(width, height, aspect) {
  if (aspect) {
    return centerCrop(makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height), width, height)
  }
  return { unit: '%', x: 5, y: 5, width: 90, height: 90 }
}

export default function ImageUpload({ value, onChange, folder = 'general', aspect }) {
  const [rawSrc, setRawSrc] = useState(null)
  const [crop, setCrop] = useState()
  const [outputWidth, setOutputWidth] = useState(800)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const imgRef = useRef(null)

  function openCropFromFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => { setRawSrc(reader.result); setCrop(undefined); setError('') }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  function openCropModal(src) {
    setRawSrc(src)
    setCrop(undefined)
    setError('')
  }

  const onImageLoad = useCallback((e) => {
    const { width, height } = e.currentTarget
    setCrop(initCrop(width, height, aspect))
  }, [aspect])

  function resetCrop() {
    if (!imgRef.current) return
    const { width, height } = imgRef.current
    setCrop(initCrop(width, height, aspect))
  }

  function getOutputDims() {
    if (!crop || !imgRef.current) return null
    const img = imgRef.current
    const scaleX = img.naturalWidth / img.width
    const scaleY = img.naturalHeight / img.height
    const srcW = crop.width * scaleX
    const srcH = crop.height * scaleY
    const scale = outputWidth && outputWidth < srcW ? outputWidth / srcW : 1
    return { w: Math.round(srcW * scale), h: Math.round(srcH * scale) }
  }

  async function handleConfirm() {
    if (!crop || !imgRef.current) return
    setUploading(true)
    setError('')
    try {
      const blob = await getCroppedBlob(imgRef.current, crop, outputWidth)
      const form = new FormData()
      form.append('file', blob, `crop-${Date.now()}.jpg`)
      form.append('folder', folder)
      const res = await fetch('/api/admin/upload', { method: 'POST', body: form })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || `Upload failed (${res.status})`)
      } else {
        onChange(data.url)
        setRawSrc(null)
      }
    } catch (err) {
      console.error('Upload error:', err)
      setError(err?.message || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  function handleCancel() {
    setRawSrc(null)
    setError('')
  }

  const dims = getOutputDims()

  return (
    <div>
      {/* ── Crop modal ── */}
      {rawSrc && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999,
          background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(6px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '16px',
        }}>
          <div style={{
            background: '#1e1500', border: '1px solid #2e2000', borderRadius: '16px',
            width: '100%', maxWidth: '600px', overflow: 'hidden', display: 'flex', flexDirection: 'column',
          }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #2e2000', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ color: '#f5c842', fontSize: '13px', letterSpacing: '2px', textTransform: 'uppercase', margin: 0 }}>
                Crop & Resize
              </h3>
              <button onClick={handleCancel} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: '20px', cursor: 'pointer', lineHeight: 1 }}>✕</button>
            </div>

            {/* Crop area */}
            <div style={{ background: '#0a0600', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', minHeight: '300px', maxHeight: '55vh', overflow: 'auto' }}>
              <ReactCrop
                crop={crop}
                onChange={c => setCrop(c)}
                aspect={aspect}
                ruleOfThirds
                style={{ maxWidth: '100%', maxHeight: '50vh' }}
              >
                <img
                  ref={imgRef}
                  src={rawSrc}
                  crossOrigin="anonymous"
                  onLoad={onImageLoad}
                  style={{ maxWidth: '100%', maxHeight: '50vh', display: 'block' }}
                  alt="crop preview"
                />
              </ReactCrop>
            </div>

            {/* Controls */}
            <div style={{ padding: '16px 20px', borderTop: '1px solid #2e2000' }}>
              {/* Size presets */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', letterSpacing: '1px', flexShrink: 0, width: '34px' }}>Size</span>
                {SIZE_PRESETS.map(p => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => setOutputWidth(p.width)}
                    style={{
                      padding: '5px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer',
                      fontSize: '11px', fontWeight: 600,
                      background: outputWidth === p.width ? 'linear-gradient(135deg, #f5c842, #c8940c)' : '#2e2000',
                      color: outputWidth === p.width ? '#0a0600' : 'rgba(255,255,255,0.6)',
                    }}
                  >
                    {p.label}{p.width ? ` ${p.width}px` : ''}
                  </button>
                ))}
              </div>

              {/* Live output size */}
              {dims ? (
                <p style={{ fontSize: '11px', color: '#26de81', marginBottom: '14px' }}>
                  ✓ Output: {dims.w} × {dims.h} px
                </p>
              ) : (
                <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.25)', marginBottom: '14px' }}>
                  Drag the handles to crop
                </p>
              )}

              {error && <p style={{ color: '#ff6b6b', fontSize: '12px', marginBottom: '12px' }}>{error}</p>}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', alignItems: 'center' }}>
                <button onClick={resetCrop} style={{
                  padding: '9px 18px', borderRadius: '8px', border: '1px solid #2e2000',
                  background: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '12px',
                }}>
                  ↺ Reset
                </button>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleCancel} style={{
                    padding: '9px 18px', borderRadius: '8px', border: '1px solid #2e2000',
                    background: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: '12px',
                  }}>
                    Cancel
                  </button>
                  <button onClick={handleConfirm} disabled={uploading || !crop} style={{
                    padding: '9px 22px', borderRadius: '8px', border: 'none',
                    background: 'linear-gradient(135deg, #f5c842, #c8940c)',
                    color: '#0a0600', fontWeight: 700, fontSize: '12px',
                    cursor: (uploading || !crop) ? 'not-allowed' : 'pointer',
                    opacity: (uploading || !crop) ? 0.7 : 1,
                  }}>
                    {uploading ? 'Uploading…' : dims ? `Save ${dims.w}×${dims.h}` : 'Save Image'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Current image preview ── */}
      {value && !rawSrc && (
        <div style={{ position: 'relative', marginBottom: '12px' }}>
          <img src={value} alt="preview" style={{
            width: '100%', maxHeight: '200px', objectFit: 'cover',
            borderRadius: '8px', display: 'block',
          }} />
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
