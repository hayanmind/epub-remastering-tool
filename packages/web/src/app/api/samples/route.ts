import { NextResponse } from 'next/server';
import { loadSampleMetadata } from '@/lib/server/services';

export async function GET() {
  const samples = await loadSampleMetadata();
  return NextResponse.json({ samples });
}
