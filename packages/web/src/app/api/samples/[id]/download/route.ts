import { NextRequest, NextResponse } from 'next/server';
import { loadSampleMetadata, getSampleBuffer } from '@/lib/server/services';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const samples = await loadSampleMetadata();
  const sample = samples.find((s) => s.id === id);

  if (!sample) {
    return NextResponse.json(
      { error: { message: 'Sample not found' } },
      { status: 404 },
    );
  }

  const buffer = await getSampleBuffer(sample.filename);

  if (!buffer) {
    return NextResponse.json(
      { error: { message: 'Sample file not found' } },
      { status: 404 },
    );
  }

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/epub+zip',
      'Content-Disposition': `attachment; filename="${sample.filename}"`,
    },
  });
}
