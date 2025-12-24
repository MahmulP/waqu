import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
import { autoReplyLogs, autoReplies } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';

// GET /api/auto-reply-logs - Get all auto-reply logs for current session
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

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID required' },
        { status: 400 }
      );
    }

    const { db } = await getDbConnection();
    
    const logs = await db
      .select({
        id: autoReplyLogs.id,
        autoReplyId: autoReplyLogs.autoReplyId,
        autoReplyName: autoReplies.name,
        senderNumber: autoReplyLogs.senderNumber,
        triggerMessage: autoReplyLogs.triggerMessage,
        sentReply: autoReplyLogs.sentReply,
        createdAt: autoReplyLogs.createdAt,
      })
      .from(autoReplyLogs)
      .leftJoin(autoReplies, eq(autoReplyLogs.autoReplyId, autoReplies.id))
      .where(
        and(
          eq(autoReplyLogs.userId, userId),
          eq(autoReplyLogs.sessionId, sessionId)
        )
      )
      .orderBy(desc(autoReplyLogs.createdAt))
      .limit(100);
    
    return NextResponse.json({ logs });
  } catch (error: any) {
    console.error('Error fetching auto-reply logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch auto-reply logs' },
      { status: 500 }
    );
  }
}
