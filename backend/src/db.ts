import mysql from "mysql2/promise";

export const db = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "123456789",
  database: process.env.DB_NAME || "classroom",
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  timezone: "+07:00",
  charset: "utf8mb4",
});
