import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  try {
    cookies().delete('__session');
    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Failed to clear session cookie:', error);
    return NextResponse.json({ error: 'Failed to log out' }, { status: 500 });
  }
}
