import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
import { contacts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// PUT /api/contacts/[id]
export async function PUT(
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
    const { name, phoneNumber, groupId, email, notes } = body;

    const { db } = await getDbConnection();
    await db
      .update(contacts)
      .set({
        ...(name && { name }),
        ...(phoneNumber && { phoneNumber }),
        ...(groupId !== undefined && { groupId }),
        ...(email !== undefined && { email }),
        ...(notes !== undefined && { notes }),
      })
      .where(and(eq(contacts.id, id), eq(contacts.userId, userId)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating contact:', error);
    return NextResponse.json({ error: 'Failed to update contact' }, { status: 500 });
  }
}

// DELETE /api/contacts/[id]
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
    await db
      .delete(contacts)
      .where(and(eq(contacts.id, id), eq(contacts.userId, userId)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting contact:', error);
    return NextResponse.json({ error: 'Failed to delete contact' }, { status: 500 });
  }
}
