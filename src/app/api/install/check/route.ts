import { NextResponse } from 'next/server';
import { testConnection, getDbConnection } from '@/lib/db';
import { users } from '@/lib/db/schema';

export async function GET() {
  try {
    // Check if install is disabled via environment variable
    if (process.env.DISABLE_INSTALL === 'true') {
      return NextResponse.json({
        success: true,
        isInstalled: true,
        message: 'Installation is disabled',
      });
    }

    // Check database connection
    const isConnected = await testConnection();
    
    if (!isConnected) {
      return NextResponse.json({
        success: true,
        isInstalled: false,
      });
    }

    // Check if at least one user exists
    const { db } = await getDbConnection();
    const existingUsers = await db.select().from(users).limit(1);
    
    return NextResponse.json({
      success: true,
      isInstalled: existingUsers.length > 0,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      isInstalled: false,
      error: error.message,
    });
  }
}
