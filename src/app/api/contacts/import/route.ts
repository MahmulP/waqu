import { NextRequest, NextResponse } from 'next/server';
import { getDbConnection } from '@/lib/db';
import { contacts, contactGroups } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import * as XLSX from 'xlsx';

// POST /api/contacts/import - Import contacts from CSV/Excel
export async function POST(request: NextRequest) {
  try {
    const userId = request.cookies.get('userId')?.value;
    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Read file as buffer
    const buffer = await file.arrayBuffer();
    
    // Parse file (supports CSV, XLS, XLSX)
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
    
    if (data.length < 2) {
      return NextResponse.json({ error: 'File is empty or invalid' }, { status: 400 });
    }

    // Parse header
    const header = data[0].map(h => String(h).trim().toLowerCase());
    
    // Find column indices
    const nameIndex = header.findIndex(h => h.includes('name'));
    const phoneIndex = header.findIndex(h => h.includes('phone') || h.includes('number'));
    const emailIndex = header.findIndex(h => h.includes('email'));
    const groupIndex = header.findIndex(h => h.includes('group'));
    const notesIndex = header.findIndex(h => h.includes('note'));

    if (nameIndex === -1 || phoneIndex === -1) {
      return NextResponse.json({ 
        error: 'File must have "name" and "phone" columns' 
      }, { status: 400 });
    }

    const { db } = await getDbConnection();
    
    // Get existing groups
    const existingGroups = await db
      .select()
      .from(contactGroups)
      .where(eq(contactGroups.userId, userId));

    const groupMap = new Map(existingGroups.map((g: typeof contactGroups.$inferSelect) => [g.name.toLowerCase(), g.id]));

    let imported = 0;
    const errors: string[] = [];

    // Process each row
    for (let i = 1; i < data.length; i++) {
      try {
        const row = data[i];
        
        const name = String(row[nameIndex] || '').trim();
        const phoneNumber = String(row[phoneIndex] || '').trim();
        const email = emailIndex !== -1 ? String(row[emailIndex] || '').trim() : '';
        const groupName = groupIndex !== -1 ? String(row[groupIndex] || '').trim() : '';
        const notes = notesIndex !== -1 ? String(row[notesIndex] || '').trim() : '';

        if (!name || !phoneNumber) {
          errors.push(`Row ${i + 1}: Missing name or phone number`);
          continue;
        }

        // Find or create group
        let groupId = null;
        if (groupName) {
          const groupNameLower = groupName.toLowerCase();
          
          if (groupMap.has(groupNameLower)) {
            groupId = groupMap.get(groupNameLower)!;
          } else {
            // Create new group
            const newGroupId = uuidv4();
            await db.insert(contactGroups).values({
              id: newGroupId,
              userId,
              name: groupName,
            });
            groupMap.set(groupNameLower, newGroupId);
            groupId = newGroupId;
          }
        }

        // Insert contact
        await db.insert(contacts).values({
          id: uuidv4(),
          userId,
          groupId,
          name,
          phoneNumber,
          email: email || null,
          notes: notes || null,
        });

        imported++;
      } catch (error: any) {
        errors.push(`Row ${i + 1}: ${error.message}`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      imported,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error: any) {
    console.error('Error importing contacts:', error);
    return NextResponse.json({ 
      error: 'Failed to import contacts: ' + error.message 
    }, { status: 500 });
  }
}
