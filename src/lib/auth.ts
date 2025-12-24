// Simple auth helper - you can replace with NextAuth or other solution
import { cookies } from 'next/headers';

export async function getCurrentUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get('userId')?.value || null;
}

export async function setCurrentUserId(userId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('userId', userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

export async function clearCurrentUserId(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('userId');
}
