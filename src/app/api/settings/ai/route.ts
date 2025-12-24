import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { AIService } from '@/lib/ai-service';
import { EncryptionService } from '@/lib/encryption';

// GET /api/settings/ai - Get AI settings
export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { db } = await getDbConnection();
    
    const [user] = await db
      .select({
        hasApiKey: users.aiApiKey,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      hasApiKey: !!user.hasApiKey,
      model: 'gpt-3.5-turbo',
    });
  } catch (error: any) {
    console.error('Error fetching AI settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI settings' },
      { status: 500 }
    );
  }
}

// POST /api/settings/ai - Update AI settings
export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { aiApiKey } = body;

    // Validate API key if provided
    if (aiApiKey) {
      const isValid = await AIService.validateApiKey(aiApiKey);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Invalid OpenAI API key' },
          { status: 400 }
        );
      }
    }

    const { db } = await getDbConnection();
    
    // Encrypt the API key before storing
    const encryptedKey = aiApiKey ? EncryptionService.encrypt(aiApiKey) : null;
    
    await db
      .update(users)
      .set({
        aiApiKey: encryptedKey,
      })
      .where(eq(users.id, userId));
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating AI settings:', error);
    return NextResponse.json(
      { error: 'Failed to update AI settings' },
      { status: 500 }
    );
  }
}
