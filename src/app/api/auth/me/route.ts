import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { db } = await getDbConnection();
    
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        isPremium: users.isPremium,
        premiumActiveDate: users.premiumActiveDate,
        premiumExpiryDate: users.premiumExpiryDate,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      user,
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get user' },
      { status: 500 }
    );
  }
}
