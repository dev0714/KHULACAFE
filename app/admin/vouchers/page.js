import { cookies } from 'next/headers'
import { verifyToken } from '../../../lib/auth'
import { redirect } from 'next/navigation'
import { getVouchersAdmin } from '../actions'
import VouchersClient from './VouchersClient'

export const metadata = { title: 'Vouchers | Khula Admin' }
export const dynamic = 'force-dynamic'

export default async function VouchersPage() {
  const token = cookies().get('admin_session')?.value
  const payload = token ? await verifyToken(token) : null
  if (!payload) redirect('/staff-login')

  const { vouchers, tableMissing } = await getVouchersAdmin()
  return <VouchersClient initial={vouchers} tableMissing={tableMissing} />
}
