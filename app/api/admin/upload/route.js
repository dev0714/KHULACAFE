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
  const folder = formData.get('folder') || 'general'

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const ext = file.name.split('.').pop()
  const path = `${folder}/${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error } = await supabaseAdmin.storage
    .from('khula-media')
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data } = supabaseAdmin.storage.from('khula-media').getPublicUrl(path)
  return NextResponse.json({ url: data.publicUrl })
}
