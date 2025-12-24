import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
import { bulkMessages } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// GET /api/bulk-messages/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.cookies.get('userId')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { db } = await getDbConnection();
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

    return NextResponse.json({ campaign });
  } catch (error: any) {
    console.error('Error fetching bulk message:', error);
    return NextResponse.json({ error: 'Failed to fetch bulk message' }, { status: 500 });
  }
}

// DELETE /api/bulk-messages/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = request.cookies.get('userId')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { db } = await getDbConnection();
    
    // Check if campaign can be deleted (not processing)
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

    if (campaign.status === 'processing') {
      return NextResponse.json({ error: 'Cannot delete campaign while processing' }, { status: 400 });
    }

    await db
      .delete(bulkMessages)
      .where(
        and(
          eq(bulkMessages.id, id),
          eq(bulkMessages.userId, userId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting bulk message:', error);
    return NextResponse.json({ error: 'Failed to delete bulk message' }, { status: 500 });
  }
}
