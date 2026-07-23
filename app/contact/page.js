import { getContactSettings } from '../../lib/contact-settings'
import ContactClient from './ContactClient'

export const dynamic = 'force-dynamic'

export default async function ContactPage() {
  const settings = await getContactSettings()
  return <ContactClient settings={settings} />
}
