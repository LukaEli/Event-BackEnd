import sqlite3 from "sqlite3";
import pg from "pg"; // For PostgreSQL when deploying
const sql3 = sqlite3.verbose();

// Local development (SQLite)
const DB =
  process.env.NODE_ENV === "production"
    ? new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false },
      })
    : new sqlite3.Database("./mydata.db");

function connected(err) {
  if (err) {
    console.error(err.message);
    return;
  }
  console.log("Created the DB or SQLite DB does already exist");
}

// Function to create a table
function createTable(sql, tableName) {
  DB.run(sql, [], (err) => {
    if (err) {
      console.error(`Error creating ${tableName} table: ${err.message}`);
      return;
    }
    console.log(`Created ${tableName} Table`);
  });
}

// SQL for Users table
const usersTableSQL = `
    CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT CHECK(role IN ('user', 'staff')) NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
`;
createTable(usersTableSQL, "Users");

// SQL for Events table
const eventsTableSQL = `
    CREATE TABLE IF NOT EXISTS Events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        location TEXT,
        date TIMESTAMP NOT NULL,
        created_by INTEGER NOT NULL,
        FOREIGN KEY (created_by) REFERENCES Users (id) ON DELETE CASCADE
    );
`;
createTable(eventsTableSQL, "Events");

// SQL for EventRegistrations table
const eventRegistrationsTableSQL = `
    CREATE TABLE IF NOT EXISTS EventRegistrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        event_id INTEGER NOT NULL,
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES Users (id) ON DELETE CASCADE,
        FOREIGN KEY (event_id) REFERENCES Events (id) ON DELETE CASCADE,
        UNIQUE(user_id, event_id)
    );
`;
createTable(eventRegistrationsTableSQL, "EventRegistrations");

// SQL for GoogleCalendarTokens table
const googleCalendarTokensTableSQL = `
    CREATE TABLE IF NOT EXISTS GoogleCalendarTokens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        access_token TEXT NOT NULL,
        refresh_token TEXT NOT NULL,
        token_expiry TIMESTAMP NOT NULL,
        FOREIGN KEY (user_id) REFERENCES Users (id) ON DELETE CASCADE
    );
`;
createTable(googleCalendarTokensTableSQL, "GoogleCalendarTokens");

export { DB };
