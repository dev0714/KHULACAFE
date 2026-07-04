'use server'
import { cookies } from 'next/headers'
import { verifyToken } from '../../../lib/auth'
import { supabaseAdmin } from '../../../lib/supabase-admin'
import { revalidatePath } from 'next/cache'

async function assertAdmin() {
  const token = cookies().get('admin_session')?.value
  const payload = token ? await verifyToken(token) : null
  if (!payload) throw new Error('Unauthorized')
}

export async function markMessageRead(id) {
  await assertAdmin()
  await supabaseAdmin.from('contact_messages').update({ is_read: true }).eq('id', id)
  revalidatePath('/admin/messages')
}

export async function deleteMessage(id) {
  await assertAdmin()
  await supabaseAdmin.from('contact_messages').delete().eq('id', id)
  revalidatePath('/admin/messages')
}

export async function getUnreadMessageCount() {
  const { count } = await supabaseAdmin
    .from('contact_messages')
    .select('id', { count: 'exact', head: true })
    .eq('is_read', false)
  return count ?? 0
}
