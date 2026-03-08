import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import classRoutes from "./routes/class.routes";
import userRoutes from "./routes/user.routes";
import classUser from "./routes/classUser.routes";
import assignment from "./routes/assignment.routes";
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/class", classRoutes);
app.use("/api/user", userRoutes);
app.use("/api/class-user", classUser);
app.use("/api/assignment", assignment);

app.get("/", (_req, res) => {
  res.send("API is running...");
});

app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
