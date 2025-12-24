import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session-manager';
import { getDbConnection } from '@/lib/db';
import { sessions } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

function getSessionManager(): SessionManager {
  return (global as any).sessionManager;
}

// GET /api/sessions - Get user's sessions
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
    
    // Get sessions from database
    const userSessions = await db
      .select()
      .from(sessions)
      .where(eq(sessions.userId, userId));

    // Get live status from SessionManager
    const sessionManager = getSessionManager();
    const liveSessions = sessionManager.getAllSessions();
    
    // Merge database sessions with live status
    const mergedSessions = userSessions.map((dbSession: typeof sessions.$inferSelect) => {
      const liveSession = liveSessions.find(s => s.id === dbSession.id);
      return {
        id: dbSession.id,
        phoneNumber: dbSession.phoneNumber || liveSession?.phoneNumber,
        status: liveSession?.status || 'disconnected',
        createdAt: dbSession.createdAt.toISOString(),
        lastActive: dbSession.lastActive?.toISOString(),
      };
    });
    
    return NextResponse.json({ sessions: mergedSessions });
  } catch (error: any) {
    console.error('Error fetching sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    );
  }
}

// POST /api/sessions - Create a new session
export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const sessionManager = getSessionManager();
    const sessionId = await sessionManager.createSession();
    
    // Save to database
    const { db } = await getDbConnection();
    await db.insert(sessions).values({
      id: sessionId,
      userId,
      status: 'connecting',
      createdAt: new Date(),
    });
    
    return NextResponse.json({
      sessionId,
      status: 'connecting',
    });
  } catch (error: any) {
    console.error('Error creating session:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create session' },
      { status: 500 }
    );
  }
}
