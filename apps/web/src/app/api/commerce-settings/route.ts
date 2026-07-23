import { NextResponse } from 'next/server'
import config from '@payload-config'
import { getPayload } from 'payload'

export async function GET() {
  try {
    const payload = await getPayload({ config })

    const result = await payload.findGlobal({
      slug: 'commerce-settings',
    })

    return NextResponse.json({
      minimumWholesaleOrder: result.minimumWholesaleOrder,
      wholesaleEnabled: result.wholesaleEnabled,
      defaultCurrency: result.defaultCurrency,
    })
  } catch (error) {
    console.error('Error fetching commerce settings:', error)
    return NextResponse.json(
      { minimumWholesaleOrder: 150000, wholesaleEnabled: true, defaultCurrency: 'ARS' },
      { status: 200 }
    )
  }
}