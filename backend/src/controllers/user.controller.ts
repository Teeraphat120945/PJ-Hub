import { Request, Response } from "express";
import { db } from "../db";

export const getUsers = async (req: Request, res: Response) => {
  const userRole = Number((req as any).user?.role);
  if (userRole !== 0 && userRole !== 1) {
    return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึงข้อมูลผู้ใช้งาน" });
  }

  const conn = await db.getConnection();
  try {
    const [rows]: any = await conn.execute(`
      SELECT users.user_id, users.user_name, users.role_flg, ref_role.role_name, users.deleted_flg
      FROM users 
      LEFT JOIN ref_role ON ref_role.role_id = users.role_flg
      ORDER BY user_id ASC
    `);

    const users = rows.map((user: any) => ({
      user_id: user.user_id,
      user_name: user.user_name,
      role_flg: Number(user.role_flg),
      role_name: user.role_name,
      deleted_flg: user.deleted_flg === 0 ? 0 : 1
    }));
    res.json({ data: users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "database error" });
  } finally {
    conn.release();
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  const currentRole = Number((req as any).user?.role);
  const { user_id } = req.params;
  const { role_flg } = req.body;

  if (typeof role_flg !== "number") {
    return res.status(400).json({ message: "role_flg ไม่ถูกต้อง" });
  }

  if (currentRole !== 0 && currentRole !== 1) {
    return res.status(403).json({ message: "ไม่มีสิทธิ์แก้ไขระดับผู้ใช้" });
  }

  let conn;
  try {
    conn = await db.getConnection();

    if (currentRole === 1) {
      if (role_flg !== 2 && role_flg !== 3) {
        return res.status(403).json({
          message: "อาจารย์สามารถปรับระดับผู้ใช้ได้เฉพาะ 'นิสิต' และ 'ผู้ใช้ทั่วไป' เท่านั้น",
        });
      }

      const [target]: any = await conn.query(
        `SELECT role_flg FROM users WHERE user_id = ? AND deleted_flg = 0`,
        [user_id]
      );

      if (target.length === 0) {
        return res.status(404).json({ message: "ไม่พบผู้ใช้ในระบบ" });
      }

      const targetRole = Number(target[0].role_flg);
      if (targetRole === 0 || targetRole === 1) {
        return res.status(403).json({
          message: "อาจารย์ไม่สามารถปรับเปลี่ยนระดับของผู้ดูแลระบบหรืออาจารย์ท่านอื่นได้",
        });
      }
    }

    const [result]: any = await conn.execute(
      `
      UPDATE users
      SET role_flg = ?
      WHERE user_id = ?
      `,
      [role_flg, user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "ไม่พบผู้ใช้ในระบบ" });
    }

    res.json({ message: "แก้ไขสิทธิ์ผู้ใช้เรียบร้อย" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "database error" });
  } finally {
    conn?.release();
  }
};

export const updateUserActive = async (req: Request, res: Response) => {
  const requesterId = (req as any).user?.user_id || (req as any).user?.id;
  const userRole = (req as any).user?.role;
  if (Number(userRole) !== 0) {
    return res.status(403).json({ message: "สงวนสิทธิ์เฉพาะผู้ดูแลระบบเท่านั้น" });
  }

  const { user_id } = req.params;
  const { active } = req.body;

  if (String(user_id) === String(requesterId) && Number(active) === 1) {
    return res.status(400).json({ message: "ไม่สามารถระงับการใช้งานบัญชีของตนเองได้" });
  }

  const conn = await db.getConnection();
  try {
    const [result]: any = await conn.execute(
      `
      UPDATE users
      SET deleted_flg = ?
      WHERE user_id = ?
      `,
      [active, user_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        message: "ไม่พบ user_id นี้ในระบบ",
      });
    }

    res.json({ message: "แก้ไขเรียบร้อย" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "database error" });
  } finally {
    conn.release();
  }
};

export const getAvaliableUsers = async (req: Request, res: Response) => {
  const { classId } = req.params;
  const requesterId = (req as any).user?.user_id || (req as any).user?.id;
  const requesterRole = Number((req as any).user?.role);

  const conn = await db.getConnection();
  try {
    if (requesterRole !== 0) {
      const [classRows]: any = await conn.query(
        "SELECT created_by FROM classes WHERE class_id = ? AND deleted_flg = 0",
        [classId]
      );

      if (classRows.length === 0) {
        return res.status(404).json({ message: "ไม่พบรายวิชา" });
      }

      const isCreator = String(classRows[0].created_by) === String(requesterId);
      if (!isCreator) {
        return res.status(403).json({
          message: "สงวนสิทธิ์เฉพาะอาจารย์ผู้รับผิดชอบรายวิชาหรือผู้ดูแลระบบเท่านั้น",
        });
      }
    }

    const sql = `
      SELECT u.user_id, u.user_name, u.role_flg
      FROM users AS u
      WHERE u.user_id NOT IN (
        SELECT cu.user_id
        FROM class_users AS cu
        WHERE cu.class_id = ?
          AND cu.deleted_flg = 0
      ) AND u.deleted_flg = 0
        AND u.role_flg != 0
    `;

    const [users] = await conn.query(sql, [classId]);

    res.json({
      data: users,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "database error" });
  } finally {
    conn.release();
  }
};

export const getRoles = async (req: any, res: any) => {
  const conn = await db.getConnection();
  try {
    const sql = `
      SELECT role_id, role_name 
      FROM ref_role
      ORDER BY role_id ASC
    `;

    const [rows] = await conn.query(sql);
    return res.json(rows);
  } catch (err) {
    console.error("GET ROLE ERROR:", err);
    return res.status(500).json({ message: "database error" });
  } finally {
    conn.release();
  }
};