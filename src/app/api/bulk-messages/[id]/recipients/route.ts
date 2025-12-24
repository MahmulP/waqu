import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
import { bulkMessageRecipients, contacts } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// GET /api/bulk-messages/[id]/recipients - Get all recipients for a campaign
export async function GET(
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

    // Fetch recipients with contact details
    const recipients = await db
      .select({
        id: bulkMessageRecipients.id,
        phoneNumber: bulkMessageRecipients.phoneNumber,
        status: bulkMessageRecipients.status,
        sentAt: bulkMessageRecipients.sentAt,
        errorMessage: bulkMessageRecipients.errorMessage,
        contact: {
          name: contacts.name,
          email: contacts.email,
        },
      })
      .from(bulkMessageRecipients)
      .leftJoin(contacts, eq(bulkMessageRecipients.contactId, contacts.id))
      .where(eq(bulkMessageRecipients.bulkMessageId, id));

    return NextResponse.json({ recipients });
  } catch (error: any) {
    console.error('Error fetching recipients:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipients' },
      { status: 500 }
    );
  }
}
