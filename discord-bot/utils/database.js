import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

let pool;

export async function getDbConnection() {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;
    
    if (!databaseUrl) {
      throw new Error('DATABASE_URL is not defined in environment variables');
    }

    // Parse DATABASE_URL: mysql://user:password@host:port/database
    const match = databaseUrl.match(/mysql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
    
    if (!match) {
      throw new Error('Invalid DATABASE_URL format');
    }

    const [, user, password, host, port, database] = match;

    pool = mysql.createPool({
      host,
      port: parseInt(port),
      user,
      password,
      database,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    console.log('✅ Database pool created for Discord Bot');
  }

  return pool;
}

// Alias для совместимости
export { getDbConnection as getDatabase };

export async function closeDbConnection() {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('✅ Database pool closed');
  }
}
