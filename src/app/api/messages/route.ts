import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
import { messages, sessions } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { SessionManager } from '@/lib/session-manager';
import { ValidationError } from '@/lib/types';
import { validateMessagePayload } from '@/lib/validation';

function getSessionManager(): SessionManager {
  return (global as any).sessionManager;
}

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
    const limit = parseInt(searchParams.get('limit') || '100');

    const { db } = await getDbConnection();
    
    let query = db
      .select({
        id: messages.id,
        sessionId: messages.sessionId,
        from: messages.from,
        to: messages.to,
        body: messages.body,
        type: messages.type,
        hasMedia: messages.hasMedia,
        timestamp: messages.timestamp,
        isFromMe: messages.isFromMe,
        createdAt: messages.createdAt,
        sessionPhoneNumber: sessions.phoneNumber,
      })
      .from(messages)
      .leftJoin(sessions, eq(messages.sessionId, sessions.id))
      .where(eq(messages.userId, userId))
      .orderBy(desc(messages.timestamp))
      .limit(limit);

    // Filter by session if provided
    if (sessionId) {
      query = db
        .select({
          id: messages.id,
          sessionId: messages.sessionId,
          from: messages.from,
          to: messages.to,
          body: messages.body,
          type: messages.type,
          hasMedia: messages.hasMedia,
          timestamp: messages.timestamp,
          isFromMe: messages.isFromMe,
          createdAt: messages.createdAt,
          sessionPhoneNumber: sessions.phoneNumber,
        })
        .from(messages)
        .leftJoin(sessions, eq(messages.sessionId, sessions.id))
        .where(and(
          eq(messages.userId, userId),
          eq(messages.sessionId, sessionId)
        ))
        .orderBy(desc(messages.timestamp))
        .limit(limit);
    }

    const messageList = await query;
    
    return NextResponse.json({ messages: messageList });
  } catch (error: any) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}


// POST /api/messages - Send a message
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate payload
    validateMessagePayload(body);
    
    const { sessionId, recipient, message, media } = body;

    // Validate media if present
    if (media) {
      if (!media.data || !media.mimetype) {
        return NextResponse.json(
          { success: false, error: 'Media must include data and mimetype' },
          { status: 400 }
        );
      }
    }
    
    const sessionManager = getSessionManager();
    const messageId = await sessionManager.sendMessage(sessionId, recipient, message, media);
    
    return NextResponse.json({
      success: true,
      messageId,
    });
  } catch (error: any) {
    console.error('Error sending message:', error);
    
    if (error instanceof ValidationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to send message' },
      { status: 500 }
    );
  }
}
