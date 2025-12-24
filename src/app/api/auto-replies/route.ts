import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
import { autoReplies } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// GET /api/auto-replies - Get all auto-replies
export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    const { db } = await getDbConnection();
    
    let query = db
      .select()
      .from(autoReplies)
      .where(eq(autoReplies.userId, userId));

    // Filter by session if provided
    if (sessionId) {
      query = db
        .select()
        .from(autoReplies)
        .where(and(
          eq(autoReplies.userId, userId),
          eq(autoReplies.sessionId, sessionId)
        ));
    }

    const replies = await query;
    
    return NextResponse.json({ autoReplies: replies });
  } catch (error: any) {
    console.error('Error fetching auto-replies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch auto-replies' },
      { status: 500 }
    );
  }
}

// POST /api/auto-replies - Create new auto-reply
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
    const { name, matchType, trigger, reply, sessionId, caseSensitive, priority, useAi, aiContext, allowedNumbers } = body;

    if (!name || !matchType || !trigger) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // If not using AI, reply is required
    if (!useAi && !reply) {
      return NextResponse.json(
        { error: 'Reply message is required when not using AI' },
        { status: 400 }
      );
    }

    const validMatchTypes = ['exact', 'contains', 'starts_with', 'ends_with', 'regex'];
    if (!validMatchTypes.includes(matchType)) {
      return NextResponse.json(
        { error: 'Invalid match type' },
        { status: 400 }
      );
    }

    const { db } = await getDbConnection();
    
    const id = uuidv4();
    await db.insert(autoReplies).values({
      id,
      userId,
      sessionId: sessionId || null,
      name,
      matchType,
      trigger,
      reply: reply || '',
      caseSensitive: caseSensitive || false,
      priority: priority || 'normal',
      isActive: true,
      useAi: useAi || false,
      aiContext: aiContext || null,
      allowedNumbers: allowedNumbers || null,
    });
    
    return NextResponse.json({
      success: true,
      id,
    });
  } catch (error: any) {
    console.error('Error creating auto-reply:', error);
    return NextResponse.json(
      { error: 'Failed to create auto-reply' },
      { status: 500 }
    );
  }
}
