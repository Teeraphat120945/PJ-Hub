import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";

import authRoutes from "./routes/auth.routes";
import classRoutes from "./routes/class.routes";
import userRoutes from "./routes/user.routes";
import classUser from "./routes/classUser.routes";
import assignment from "./routes/assignment.routes";
import comment from "./routes/comment.routes";

const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
    exposedHeaders: ["Content-Disposition"],
  })
);
app.use(express.json());

import multer from "multer";

app.use("/api/auth", authRoutes);
app.use("/api/class", classRoutes);
app.use("/api/user", userRoutes);
app.use("/api/class-user", classUser);
app.use("/api/assignment", assignment);
app.use("/api/comments", comment);

app.get("/", (_req, res) => {
  res.send("API is running...");
});

// Global error handler (handles Multer errors and uncaught route errors)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "ขนาดไฟล์เกินกำหนด (สูงสุด 50MB ต่อไฟล์)" });
    }
    if (err.code === "LIMIT_FILE_COUNT") {
      return res.status(400).json({ message: "จำนวนไฟล์เกินกำหนด (สูงสุด 10 ไฟล์)" });
    }
    return res.status(400).json({ message: `ข้อผิดพลาดในการอัปโหลดไฟล์: ${err.message}` });
  }

  if (err) {
    console.error("Unhandled error:", err);
    return res.status(err.status || 500).json({
      message: err.message || "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์",
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
});