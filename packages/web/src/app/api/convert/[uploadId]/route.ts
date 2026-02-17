import { NextRequest, NextResponse } from 'next/server';
import { startConversion } from '@/lib/server/services';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ uploadId: string }> },
) {
  const { uploadId } = await params;
  const body = await request.json();
  const options = body.options ?? {};

  try {
    const job = startConversion(uploadId, options);
    return NextResponse.json(
      { jobId: job.jobId, status: 'processing' },
      { status: 202 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Upload not found';
    return NextResponse.json(
      { error: { message } },
      { status: 404 },
    );
  }
}
