import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
import { bulkMessages, bulkMessageRecipients, contacts } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// GET /api/bulk-messages
export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
    }

    const { db } = await getDbConnection();
    const campaigns = await db
      .select()
      .from(bulkMessages)
      .where(
        and(
          eq(bulkMessages.userId, userId),
          eq(bulkMessages.sessionId, sessionId)
        )
      )
      .orderBy(desc(bulkMessages.createdAt));

    return NextResponse.json({ campaigns });
  } catch (error: any) {
    console.error('Error fetching bulk messages:', error);
    return NextResponse.json({ error: 'Failed to fetch bulk messages' }, { status: 500 });
  }
}

// POST /api/bulk-messages
export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, groupId, name, message, delayBetweenMessages, scheduledAt, contactIds } = body;

    if (!sessionId || !name || !message) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!groupId && (!contactIds || contactIds.length === 0)) {
      return NextResponse.json({ error: 'Either groupId or contactIds required' }, { status: 400 });
    }

    const { db } = await getDbConnection();
    
    // Get contacts
    let selectedContacts;
    if (groupId) {
      selectedContacts = await db
        .select()
        .from(contacts)
        .where(
          and(
            eq(contacts.userId, userId),
            eq(contacts.groupId, groupId)
          )
        );
    } else {
      selectedContacts = await db
        .select()
        .from(contacts)
        .where(eq(contacts.userId, userId));
      
      // Filter by contactIds
      selectedContacts = selectedContacts.filter((c: typeof contacts.$inferSelect) => contactIds.includes(c.id));
    }

    if (selectedContacts.length === 0) {
      return NextResponse.json({ error: 'No contacts found' }, { status: 400 });
    }

    // Create bulk message (automatically start processing)
    const id = uuidv4();
    await db.insert(bulkMessages).values({
      id,
      userId,
      sessionId,
      groupId: groupId || null,
      name,
      message,
      delayBetweenMessages: delayBetweenMessages?.toString() || '5',
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      status: 'processing', // Auto-start
      startedAt: new Date(), // Set start time
      totalContacts: selectedContacts.length.toString(),
      sentCount: '0',
      failedCount: '0',
    });

    // Create recipients
    const recipients = selectedContacts.map((contact: typeof contacts.$inferSelect) => ({
      id: uuidv4(),
      bulkMessageId: id,
      contactId: contact.id,
      phoneNumber: contact.phoneNumber,
      status: 'pending',
    }));

    await db.insert(bulkMessageRecipients).values(recipients);

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Error creating bulk message:', error);
    return NextResponse.json({ error: 'Failed to create bulk message' }, { status: 500 });
  }
}
