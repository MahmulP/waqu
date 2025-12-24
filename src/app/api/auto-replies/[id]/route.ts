import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
import { autoReplies } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// PUT /api/auto-replies/[id] - Update auto-reply
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.cookies.get('userId')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, matchType, trigger, reply, sessionId, caseSensitive, priority, isActive, useAi, aiContext, allowedNumbers } = body;

    const { db } = await getDbConnection();
    
    await db
      .update(autoReplies)
      .set({
        ...(name && { name }),
        ...(matchType && { matchType }),
        ...(trigger && { trigger }),
        ...(reply !== undefined && { reply }),
        ...(sessionId !== undefined && { sessionId }),
        ...(caseSensitive !== undefined && { caseSensitive }),
        ...(priority && { priority }),
        ...(isActive !== undefined && { isActive }),
        ...(useAi !== undefined && { useAi }),
        ...(aiContext !== undefined && { aiContext }),
        ...(allowedNumbers !== undefined && { allowedNumbers }),
      })
      .where(and(
        eq(autoReplies.id, id),
        eq(autoReplies.userId, userId)
      ));
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating auto-reply:', error);
    return NextResponse.json(
      { error: 'Failed to update auto-reply' },
      { status: 500 }
    );
  }
}

// DELETE /api/auto-replies/[id] - Delete auto-reply
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.cookies.get('userId')?.value;

    if (!userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const { db } = await getDbConnection();
    
    await db
      .delete(autoReplies)
      .where(and(
        eq(autoReplies.id, id),
        eq(autoReplies.userId, userId)
      ));
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting auto-reply:', error);
    return NextResponse.json(
      { error: 'Failed to delete auto-reply' },
      { status: 500 }
    );
  }
}
