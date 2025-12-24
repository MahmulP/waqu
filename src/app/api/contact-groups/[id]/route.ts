import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
import { contactGroups } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

// PUT /api/contact-groups/[id]
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
    const { name, description } = body;

    const { db } = await getDbConnection();
    await db
      .update(contactGroups)
      .set({
        ...(name && { name }),
        ...(description !== undefined && { description }),
      })
      .where(and(eq(contactGroups.id, id), eq(contactGroups.userId, userId)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating contact group:', error);
    return NextResponse.json({ error: 'Failed to update contact group' }, { status: 500 });
  }
}

// DELETE /api/contact-groups/[id]
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
      .delete(contactGroups)
      .where(and(eq(contactGroups.id, id), eq(contactGroups.userId, userId)));

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting contact group:', error);
    return NextResponse.json({ error: 'Failed to delete contact group' }, { status: 500 });
  }
}
