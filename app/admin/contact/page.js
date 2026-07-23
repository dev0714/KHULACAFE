import { cookies } from 'next/headers'
import { verifyToken } from '../../../lib/auth'
import { redirect } from 'next/navigation'
import { getContactSettingsAdmin } from '../actions'
import ContactSettingsClient from './ContactSettingsClient'

export const metadata = { title: 'Find Us | Khula Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminContactPage() {
  const token = cookies().get('admin_session')?.value
  const payload = token ? await verifyToken(token) : null
  if (!payload) redirect('/staff-login')

  const settings = await getContactSettingsAdmin()
  return <ContactSettingsClient initial={settings} />
}
