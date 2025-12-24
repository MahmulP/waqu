import { NextResponse } from 'next/server';
import { testConnection } from '@/lib/db';

export async function GET() {
  try {
    const isConnected = await testConnection();
    
    return NextResponse.json({
      success: true,
      isInstalled: isConnected,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      isInstalled: false,
      error: error.message,
    });
  }
}
