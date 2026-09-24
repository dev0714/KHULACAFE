import { getContactSettings } from '../../lib/contact-settings'
import VouchersClient from './VouchersClient'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Gift Vouchers',
  description: 'Give the gift of Khula Cafe. Check a voucher code or get one for someone special.',
}

export default async function VouchersPage() {
  const settings = await getContactSettings()
  return <VouchersClient whatsapp={settings.whatsapp} email={settings.email} />
}
