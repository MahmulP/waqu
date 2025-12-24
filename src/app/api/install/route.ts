import { NextRequest, NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import { drizzle } from 'drizzle-orm/mysql2';
import { v4 as uuidv4 } from 'uuid';
import * as schema from '@/lib/db/schema';
import * as bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dbHost, dbPort, dbUser, dbPassword, dbName, adminEmail, adminName, adminPassword } = body;

    // Validate required fields
    if (!dbHost || !dbUser || !dbName || !adminEmail || !adminName || !adminPassword) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Step 1: Create database if it doesn't exist
    const rootConnection = await mysql.createConnection({
      host: dbHost,
      port: parseInt(dbPort || '3306'),
      user: dbUser,
      password: dbPassword,
    });

    await rootConnection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\``);
    await rootConnection.end();

    // Step 2: Connect to the new database
    const connection = await mysql.createConnection({
      host: dbHost,
      port: parseInt(dbPort || '3306'),
      user: dbUser,
      password: dbPassword,
      database: dbName,
    });

    const db = drizzle(connection, { schema, mode: 'default' });

    // Step 3: Run migrations
    await migrate(db, { migrationsFolder: './drizzle' });

    // Step 4: Seed admin user
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminId = uuidv4();

    await db.insert(schema.users).values({
      id: adminId,
      email: adminEmail,
      name: adminName,
      password: hashedPassword,
      isPremium: true,
      premiumActiveDate: new Date(),
      premiumExpiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
    });

    // Step 5: Update .env.local file
    const envContent = `
DB_HOST=${dbHost}
DB_PORT=${dbPort || '3306'}
DB_USER=${dbUser}
DB_PASSWORD=${dbPassword}
DB_NAME=${dbName}
`;

    // Write to .env.local
    const fs = require('fs');
    const path = require('path');
    const envPath = path.join(process.cwd(), '.env.local');
    
    let existingEnv = '';
    if (fs.existsSync(envPath)) {
      existingEnv = fs.readFileSync(envPath, 'utf-8');
    }

    // Remove old DB config if exists
    const envLines = existingEnv.split('\n').filter(line => 
      !line.startsWith('DB_HOST=') &&
      !line.startsWith('DB_PORT=') &&
      !line.startsWith('DB_USER=') &&
      !line.startsWith('DB_PASSWORD=') &&
      !line.startsWith('DB_NAME=')
    );

    const newEnv = envLines.join('\n') + envContent;
    fs.writeFileSync(envPath, newEnv.trim());

    await connection.end();

    return NextResponse.json({
      success: true,
      message: 'Installation completed successfully',
    });
  } catch (error: any) {
    console.error('Installation error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Installation failed' },
      { status: 500 }
    );
  }
}
