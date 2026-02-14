import { NextResponse } from 'next/server';
import { getDemoSubmissionEnabled } from '@/lib/redis';

export async function GET() {
  try {
    const enabled = await getDemoSubmissionEnabled();
    return NextResponse.json({ enabled });
  } catch (error) {
    console.error('Error fetching demo submission setting:', error);
    return NextResponse.json({ error: 'Failed to fetch setting' }, { status: 500 });
  }
}
