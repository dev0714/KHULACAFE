import { NextResponse } from 'next/server'
import { getContactSettings } from '../../../lib/contact-settings'

export const dynamic = 'force-dynamic'

// Public read of the editable Find Us settings (used by the footer, etc.)
export async function GET() {
  const settings = await getContactSettings()
  return NextResponse.json(settings)
}
