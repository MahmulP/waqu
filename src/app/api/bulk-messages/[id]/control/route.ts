import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
import { bulkMessages } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// POST /api/bulk-messages/[id]/control
// Actions: start, pause, resume, stop
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.cookies.get('userId')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (!['start', 'pause', 'resume', 'stop'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const { db } = await getDbConnection();
    
    // Get current campaign
    const [campaign] = await db
      .select()
      .from(bulkMessages)
      .where(
        and(
          eq(bulkMessages.id, id),
          eq(bulkMessages.userId, userId)
        )
      )
      .limit(1);

    if (!campaign) {
      return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    }

    // Validate state transitions
    const validTransitions: Record<string, string[]> = {
      draft: ['start'],
      pending: ['start'],
      processing: ['pause', 'stop'],
      paused: ['resume', 'stop'],
      completed: [],
      stopped: [],
      failed: ['start'], // Allow retry
    };

    if (!validTransitions[campaign.status]?.includes(action)) {
      return NextResponse.json(
        { error: `Cannot ${action} campaign with status ${campaign.status}` },
        { status: 400 }
      );
    }

    // Update status based on action
    const statusMap: Record<string, string> = {
      start: 'processing',
      pause: 'paused',
      resume: 'processing',
      stop: 'stopped',
    };

    const newStatus = statusMap[action];
    const updates: any = { status: newStatus };

    if (action === 'start' && !campaign.startedAt) {
      updates.startedAt = new Date();
    }

    if (action === 'stop') {
      updates.completedAt = new Date();
    }

    await db
      .update(bulkMessages)
      .set(updates)
      .where(
        and(
          eq(bulkMessages.id, id),
          eq(bulkMessages.userId, userId)
        )
      );

    return NextResponse.json({ success: true, status: newStatus });
  } catch (error: any) {
    console.error('Error controlling bulk message:', error);
    return NextResponse.json({ error: 'Failed to control bulk message' }, { status: 500 });
  }
}
