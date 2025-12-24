import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
import { contacts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// GET /api/contacts
export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const groupId = searchParams.get('groupId');

    const { db } = await getDbConnection();
    
    let query = db.select().from(contacts).where(eq(contacts.userId, userId));
    
    if (groupId) {
      query = db.select().from(contacts).where(
        and(eq(contacts.userId, userId), eq(contacts.groupId, groupId))
      );
    }

    const contactsList = await query;
    return NextResponse.json({ contacts: contactsList });
  } catch (error: any) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 500 });
  }
}

// POST /api/contacts
export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { name, phoneNumber, groupId, email, notes } = body;

    if (!name || !phoneNumber) {
      return NextResponse.json({ error: 'Name and phone number are required' }, { status: 400 });
    }

    const { db } = await getDbConnection();
    const id = uuidv4();

    await db.insert(contacts).values({
      id,
      userId,
      groupId: groupId || null,
      name,
      phoneNumber,
      email: email || null,
      notes: notes || null,
    });

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Error creating contact:', error);
    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 });
  }
}
