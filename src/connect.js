import sqlite3 from "sqlite3";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

let DB;

if (process.env.NODE_ENV === "production" || process.env.NODE_ENV === "test") {
  // PostgreSQL for production
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  pool
    .connect()
    .then(() => {
      console.log("✅ PostgreSQL database connected successfully");

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
              date DATE NOT NULL,
              start_time TIME,
              end_time TIME,
              created_by INTEGER NOT NULL REFERENCES Users(id) ON DELETE CASCADE,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
              token_expiry TIMESTAMP NOT NULL,
              created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
}
//  else {
//   // SQLite for development
//   const sql3 = sqlite3.verbose();
//   DB = new sql3.Database(
//     "./mydata.db",
//     sql3.OPEN_READWRITE | sql3.OPEN_CREATE,
//     (err) => {
//       if (err) {
//         console.error("❌ SQLite database connection error:", err);
//       } else {
//         console.log("✅ SQLite database connected successfully");

//         // Create tables for SQLite
//         DB.serialize(() => {
//           DB.run(`
//             CREATE TABLE IF NOT EXISTS Users (
//               id INTEGER PRIMARY KEY AUTOINCREMENT,
//               name TEXT NOT NULL,
//               email TEXT UNIQUE NOT NULL,
//               password TEXT NOT NULL,
//               role TEXT CHECK(role IN ('user', 'staff')) NOT NULL DEFAULT 'user',
//               created_at TEXT DEFAULT CURRENT_TIMESTAMP
//             )
//           `);

//           DB.run(`
//             CREATE TABLE IF NOT EXISTS Events (
//               id INTEGER PRIMARY KEY AUTOINCREMENT,
//               title TEXT NOT NULL,
//               description TEXT,
//               location TEXT,
//               date TEXT NOT NULL,
//               start_time TEXT,
//               end_time TEXT,
//               created_by INTEGER NOT NULL,
//               created_at TEXT DEFAULT CURRENT_TIMESTAMP,
//               FOREIGN KEY (created_by) REFERENCES Users(id) ON DELETE CASCADE
//             )
//           `);

//           DB.run(`
//             CREATE TABLE IF NOT EXISTS EventRegistrations (
//               id INTEGER PRIMARY KEY AUTOINCREMENT,
//               user_id INTEGER NOT NULL,
//               event_id INTEGER NOT NULL,
//               registered_at TEXT DEFAULT CURRENT_TIMESTAMP,
//               UNIQUE(user_id, event_id),
//               FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE,
//               FOREIGN KEY (event_id) REFERENCES Events(id) ON DELETE CASCADE
//             )
//           `);

//           DB.run(`
//             CREATE TABLE IF NOT EXISTS GoogleCalendarTokens (
//               id INTEGER PRIMARY KEY AUTOINCREMENT,
//               user_id INTEGER NOT NULL,
//               access_token TEXT NOT NULL,
//               refresh_token TEXT NOT NULL,
//               token_expiry TEXT NOT NULL,
//               created_at TEXT DEFAULT CURRENT_TIMESTAMP,
//               FOREIGN KEY (user_id) REFERENCES Users(id) ON DELETE CASCADE
//             )
//           `);
//         });
//       }
//     }
//   );
// }

export const testConnection = async () => {
  try {
    if (
      process.env.NODE_ENV === "production" ||
      process.env.NODE_ENV === "test"
    ) {
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
