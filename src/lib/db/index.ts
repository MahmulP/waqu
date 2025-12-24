import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';

let connection: mysql.Connection | null = null;
let db: any = null;

export async function getDbConnection() {
  if (!connection) {
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'whatsapp_manager',
    };

    connection = await mysql.createConnection(dbConfig);
    db = drizzle(connection, { schema, mode: 'default' });
  }

  return { connection, db };
}

export async function testConnection(): Promise<boolean> {
  try {
    const { connection } = await getDbConnection();
    await connection.ping();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

export async function closeConnection() {
  if (connection) {
    await connection.end();
    connection = null;
    db = null;
  }
}

export { schema };
