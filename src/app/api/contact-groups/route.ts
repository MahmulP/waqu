import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
import { contactGroups } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

// GET /api/contact-groups
export async function GET(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { db } = await getDbConnection();
    const groups = await db
      .select()
      .from(contactGroups)
      .where(eq(contactGroups.userId, userId));

    return NextResponse.json({ groups });
  } catch (error: any) {
    console.error('Error fetching contact groups:', error);
    return NextResponse.json({ error: 'Failed to fetch contact groups' }, { status: 500 });
  }
}

// POST /api/contact-groups
export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { db } = await getDbConnection();
    const id = uuidv4();

    await db.insert(contactGroups).values({
      id,
      userId,
      name,
      description: description || null,
    });

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Error creating contact group:', error);
    return NextResponse.json({ error: 'Failed to create contact group' }, { status: 500 });
  }
}
