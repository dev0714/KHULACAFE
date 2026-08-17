import { cookies } from 'next/headers'
import { verifyToken } from '../../../lib/auth'
import { redirect } from 'next/navigation'
import { getPaymentSettingsAdmin } from '../actions'
import PaymentsClient from './PaymentsClient'

export const metadata = { title: 'Payments | Khula Admin' }
export const dynamic = 'force-dynamic'

export default async function PaymentsPage() {
  const token = cookies().get('admin_session')?.value
  const payload = token ? await verifyToken(token) : null
  if (!payload) redirect('/staff-login')

  const settings = await getPaymentSettingsAdmin()
  return <PaymentsClient initial={settings} />
}
