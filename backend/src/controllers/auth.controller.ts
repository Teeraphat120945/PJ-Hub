import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db";

export const register = async (req: Request, res: Response) => {
  const { username, password } = req.body;
  const conn = await db.getConnection();
  if (!username || !password) {
    return res.status(400).json({ message: "กรุณาใส่ ชื่อผู้ใช้ และ รหัสผ่าน!" });
  }

  const [exists] = await conn.query(
    "SELECT user_id FROM users WHERE user_name = ? AND deleted_flg = 0",
    [username]
  );

  const [seqRows]: any = await conn.query(
      "SELECT prefix, current_value FROM ref_number WHERE name = 'user' FOR UPDATE"
  );
  const { prefix, current_value } = seqRows[0];
  const nextValue = current_value + 1;

  const userCode = `${prefix}${String(nextValue).padStart(3, "0")}`;

  if ((exists as any[]).length > 0) {
    return res.status(400).json({ message: "ชื่อผู้ใช้นี้ถูกใช้แล้ว!" });
  }
  
  const hashed = await bcrypt.hash(password, 10);
  
  await conn.query(
    "UPDATE ref_number SET current_value = ? WHERE name = 'user'",
    [nextValue]
  );

  const [result]: any = await conn.query(
    "INSERT INTO users (user_id, user_name, user_password , role_flg, deleted_flg) VALUES (?, ?, ?, 3, 0)",
    [userCode, username, hashed]
  );

  const token = jwt.sign(
  {
    id: result.insertId,
    username,
  },
  process.env.JWT_SECRET as string,
  { expiresIn: "1h" }
);
  res.json({ token });
};

export const login = async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "กรุณาใส่ชื่อผู้ใช้และรหัสผ่าน" });
  }

  const conn = await db.getConnection();

  try {
    const [rows]: any = await conn.query(
      `
      SELECT user_id, user_name, user_password, role_flg
      FROM users
      WHERE user_name = ? AND deleted_flg = 0
      `,
      [username.trim()]
    );

    if (rows.length === 0) {
      return res
        .status(401)
        .json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }

    const user = rows[0];

    const isMatch = await bcrypt.compare(
      password.trim(),
      user.user_password
    );

    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง" });
    }

    await conn.query(
      "UPDATE users SET last_login = NOW() WHERE user_id = ?",
      [user.user_id]
    );
    const token = jwt.sign(
      {
        user_id: user.user_id,
        user_name: user.user_name,
        role: user.role_flg,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );
    
    return res.json({
      returnData: {
        user_id: user.user_id,
        user_name: user.user_name,
        role: user.role_flg,
      },
      token,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error" });
  } finally {
    conn.release();
  }
};

export const getProfile = (req: any, res: Response) => {
  res.json({
    user_id: req.user.id,
    user_name: req.user.user_name,
    role: req.user.role,
  });
};



