import { NextResponse } from 'next/server';
import { getDemoUser } from '@/lib/server/services';

export async function POST() {
  return NextResponse.json({
    token: 'demo-token-' + Date.now(),
    user: getDemoUser(),
  });
}
