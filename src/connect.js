import sqlite3 from "sqlite3";
import pg from "pg"; // For PostgreSQL when deploying
import dotenv from "dotenv";

dotenv.config();

let DB;

if (process.env.NODE_ENV === "production") {
  // PostgreSQL for production
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  // Test PostgreSQL connection
  pool
    .connect()
    .then(() => {
      console.log("✅ PostgreSQL database connected successfully");

      // Create tables if they don't exist
      const createTables = async () => {
        try {
          await pool.query(`
            CREATE TABLE IF NOT EXISTS Users (
              id SERIAL PRIMARY KEY,
              name TEXT NOT NULL,
              email TEXT UNIQUE NOT NULL,
              password TEXT NOT NULL,
              role TEXT CHECK(role IN ('user', 'staff')) NOT NULL DEFAULT 'user',
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS Events (
              id SERIAL PRIMARY KEY,
              title TEXT NOT NULL,
              description TEXT,
              location TEXT,
              date TIMESTAMP NOT NULL,
              created_by INTEGER NOT NULL REFERENCES Users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS EventRegistrations (
              id SERIAL PRIMARY KEY,
              user_id INTEGER NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
              event_id INTEGER NOT NULL REFERENCES Events(id) ON DELETE CASCADE,
              registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
              UNIQUE(user_id, event_id)
            );

            CREATE TABLE IF NOT EXISTS GoogleCalendarTokens (
              id SERIAL PRIMARY KEY,
              user_id INTEGER NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
              access_token TEXT NOT NULL,
              refresh_token TEXT NOT NULL,
              token_expiry TIMESTAMP NOT NULL
            );
          `);
          console.log("✅ PostgreSQL tables created successfully");
        } catch (err) {
          console.error("❌ Error creating PostgreSQL tables:", err);
        }
      };

      createTables();
    })
    .catch((err) => {
      console.error("❌ PostgreSQL database connection error:", err);
    });

  DB = pool;
} else {
  // SQLite for development
  const sql3 = sqlite3.verbose();
  DB = new sql3.Database(
    "./mydata.db",
    sql3.OPEN_READWRITE | sql3.OPEN_CREATE,
    (err) => {
      if (err) {
        console.error("❌ SQLite database connection error:", err);
      } else {
        console.log("✅ SQLite database connected successfully");
      }
    }
  );
}

// Test query function
export const testConnection = async () => {
  try {
    if (process.env.NODE_ENV === "production") {
      const result = await DB.query("SELECT NOW()");
      console.log("📊 Database test query result:", result.rows[0]);
    } else {
      DB.get("SELECT sqlite_version()", [], (err, row) => {
        if (err) {
          console.error("❌ Database test query error:", err);
        } else {
          console.log("📊 Database test query result:", row);
        }
      });
    }
  } catch (err) {
    console.error("❌ Database test query error:", err);
  }
};

export { DB };
