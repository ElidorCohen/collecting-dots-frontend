import { NextResponse } from 'next/server';
import { DropboxService } from '@/lib/services/dropbox';
import { BUNDLED_MERCH } from '@/lib/merchandise';

// Merch is edited in the dashboard and kept at /merch/merch.json, in display order.
export async function GET() {
  try {
    const products = await new DropboxService().readMerchData();
    // Until the dashboard saves a list, the section keeps the products it shipped with
    return NextResponse.json({ success: true, data: products ?? BUNDLED_MERCH });
  } catch (error: any) {
    console.error('Error in get-merch-data GET:', error);
    return NextResponse.json({ error: 'Failed to retrieve merch data', message: error?.message || String(error) }, { status: 500 });
  }
}
