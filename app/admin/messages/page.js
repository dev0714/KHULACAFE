import { cookies } from 'next/headers'
import { verifyToken } from '../../../lib/auth'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '../../../lib/supabase-admin'
import MessagesClient from './MessagesClient'

export const metadata = { title: 'Messages | Khula Admin' }
export const dynamic = 'force-dynamic'

export default async function MessagesPage() {
  const token = cookies().get('admin_session')?.value
  const payload = token ? await verifyToken(token) : null
  if (!payload) redirect('/staff-login')

  const { data: messages, error } = await supabaseAdmin
    .from('contact_messages')
    .select('*')
    .order('created_at', { ascending: false })

  return <MessagesClient messages={messages ?? []} tableError={error?.code === '42P01'} />
}
