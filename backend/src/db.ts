import mysql from "mysql2/promise";

export const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "123456789",
  database: process.env.DB_NAME || "classroom",
});

export const initDatabase = async () => {
  try {
    const conn = await db.getConnection();
    try {
      const [columns]: any = await conn.query("SHOW COLUMNS FROM users");
      const columnNames = columns.map((c: any) => c.Field);

      if (!columnNames.includes("email")) {
        await conn.query("ALTER TABLE users ADD COLUMN email VARCHAR(255) NULL AFTER user_name");
        console.log("Added 'email' column to users table");
      }
      if (!columnNames.includes("google_id")) {
        await conn.query("ALTER TABLE users ADD COLUMN google_id VARCHAR(255) NULL AFTER user_password");
        console.log("Added 'google_id' column to users table");
      }
      if (!columnNames.includes("microsoft_id")) {
        await conn.query("ALTER TABLE users ADD COLUMN microsoft_id VARCHAR(255) NULL AFTER google_id");
        console.log("Added 'microsoft_id' column to users table");
      }
      if (!columnNames.includes("avatar_url")) {
        await conn.query("ALTER TABLE users ADD COLUMN avatar_url VARCHAR(500) NULL AFTER microsoft_id");
        console.log("Added 'avatar_url' column to users table");
      }

      try {
        await conn.query("ALTER TABLE users MODIFY COLUMN user_password VARCHAR(255) NULL");
      } catch {
      }
    } finally {
      conn.release();
    }
  } catch (err) {
    console.error("Database schema init notice:", err);
  }
};

