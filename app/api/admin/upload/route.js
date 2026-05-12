import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyToken } from '../../../../lib/auth'
import { supabaseAdmin } from '../../../../lib/supabase-admin'

export async function POST(request) {
  const token = cookies().get('admin_session')?.value
  const payload = token ? await verifyToken(token) : null
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file = formData.get('file')
  const rawFolder = formData.get('folder') || 'general'
  const folder = rawFolder.replace(/[^a-zA-Z0-9_-]/g, '')
  if (!folder) return NextResponse.json({ error: 'Invalid folder name' }, { status: 400 })

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const ext = file.name.split('.').pop().toLowerCase()
  const ALLOWED = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' }
  if (!ALLOWED[ext] || !ALLOWED[ext].includes(file.type)) {
    return NextResponse.json({ error: 'Only JPEG, PNG, WebP, and GIF images are allowed' }, { status: 400 })
  }

  const path = `${folder}/${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await supabaseAdmin.storage
    .from('khula-media')
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data } = supabaseAdmin.storage.from('khula-media').getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl })
}
