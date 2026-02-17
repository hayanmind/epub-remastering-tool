import { NextResponse } from 'next/server';
import { getDemoUser } from '@/lib/server/services';

export async function GET() {
  return NextResponse.json({ user: getDemoUser() });
}
