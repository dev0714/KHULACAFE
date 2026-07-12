import { cookies } from 'next/headers'
import { verifyToken } from '../../../lib/auth'
import { redirect } from 'next/navigation'
import { getEmailSettingsAdmin } from '../actions'
import SettingsClient from './SettingsClient'

export const metadata = { title: 'Email Settings | Khula Admin' }
export const dynamic = 'force-dynamic'

export default async function SettingsPage() {
  const token = cookies().get('admin_session')?.value
  const payload = token ? await verifyToken(token) : null
  if (!payload) redirect('/staff-login')

  const { settings, tableMissing, needsSmtpColumns } = await getEmailSettingsAdmin()
  return <SettingsClient initial={settings} tableMissing={tableMissing} needsSmtpColumns={needsSmtpColumns} />
}
