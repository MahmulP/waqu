import { NextRequest, NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session-manager';
import { SessionNotFoundError } from '@/lib/types';

function getSessionManager(): SessionManager {
  return (global as any).sessionManager;
}

// DELETE /api/sessions/[sessionId] - Delete a session
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const sessionManager = getSessionManager();
    const { sessionId } = await params;
    
    await sessionManager.deleteSession(sessionId);
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting session:', error);
    
    if (error instanceof SessionNotFoundError) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to delete session' },
      { status: 500 }
    );
  }
}
