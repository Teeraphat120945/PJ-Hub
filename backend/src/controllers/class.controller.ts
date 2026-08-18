import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db";

const JWT_SECRET = process.env.JWT_SECRET || "classroom_jwt_secret_key_2026";

export const create = async (req: Request, res: Response) => {
  const { classId, className, describe } = req.body;
  const userId = (req as any).user?.user_id || (req as any).user?.id;
  const role = Number((req as any).user?.role);

  if (!classId?.trim() || !className?.trim()) {
    return res.status(400).json({ message: "กรุณาระบุรหัสรายวิชาและชื่อรายวิชา" });
  }

  if (role !== 0 && role !== 1) {
    return res.status(403).json({ message: "สงวนสิทธิ์การสร้างรายวิชาเฉพาะอาจารย์และผู้ดูแลระบบเท่านั้น" });
  }

  const conn = await db.getConnection();
  try {
    const [existing]: any = await conn.execute(
      "SELECT class_id FROM classes WHERE class_id = ? AND deleted_flg = 0",
      [classId.trim()]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: "รหัสรายวิชานี้มีอยู่ในระบบแล้ว กรุณาใช้รหัสอื่น" });
    }

    await conn.beginTransaction();

    const [admins]: any = await conn.execute(
      `SELECT user_id FROM users WHERE role_flg = 0 AND deleted_flg = 0`,
    );

    await conn.execute(
      `INSERT INTO classes
      (class_id, class_name, class_describe, deleted_flg, created_by)
      VALUES (?, ?, ?, 0, ?)`,
      [classId.trim(), className.trim(), describe?.trim() || "", userId],
    );

    await conn.execute(
      `INSERT INTO class_users
      (class_id, user_id, view_flg, deleted_flg, created_datetime)
      VALUES (?, ?, 0, 0, NOW())`,
      [classId.trim(), userId],
    );

    for (const admin of admins) {
      if (String(admin.user_id) === String(userId)) continue;

      await conn.execute(
        `INSERT INTO class_users
        (class_id, user_id, view_flg, deleted_flg, created_datetime)
        VALUES (?, ?, 0, 0, NOW())`,
        [classId.trim(), admin.user_id],
      );
    }

    await conn.commit();
    res.status(201).json({ message: "สร้างรายวิชาสำเร็จ" });
  } catch (err: any) {
    await conn.rollback().catch(() => {});
    console.error("create class error:", err);
    if (err?.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "รหัสรายวิชานี้มีอยู่ในระบบแล้ว" });
    }
    res.status(500).json({ message: "สร้างรายวิชาไม่สำเร็จ" });
  } finally {
    conn.release();
  }
};

export const view = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];
    const search = (req.query.search as string)?.trim();

    let user_id: string | null = null;
    let role: number | null = null;

    if (token) {
      try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        user_id = decoded.user_id;
        role = Number(decoded.role);
      } catch {
        user_id = null;
        role = null;
      }
    }

    const isGuest = role === null || role === 3;

    let rows: any;

    if (!search) {
      if (!isGuest && user_id) {
        [rows] = await db.execute(
          `
          SELECT c.class_id, c.class_name, c.class_describe, c.created_datetime, c.created_by
          FROM classes c
          LEFT JOIN class_users cu ON cu.class_id = c.class_id
          WHERE c.deleted_flg = 0
            AND cu.user_id = ?
            AND cu.view_flg = 0
            AND cu.deleted_flg = 0
          ORDER BY c.created_datetime DESC
          `,
          [user_id],
        );
      } else {
        [rows] = await db.execute(
          `
          SELECT c.class_id, c.class_name, c.class_describe, c.created_datetime, c.created_by
          FROM classes c
          WHERE c.deleted_flg = 0
          ORDER BY c.created_datetime DESC
          `,
        );
      }
    } else {
      const keyword = `%${search}%`;

      if (!isGuest && user_id) {
        [rows] = await db.execute(
          `
          SELECT DISTINCT
            c.class_id,
            c.class_name,
            c.class_describe,
            c.created_datetime,
            c.created_by
          FROM classes c
          LEFT JOIN class_users cu ON cu.class_id = c.class_id
          LEFT JOIN class_assignments ca ON ca.class_id = c.class_id AND ca.deleted_flg = 0
          WHERE c.deleted_flg = 0
            AND cu.user_id = ?
            AND cu.view_flg = 0
            AND cu.deleted_flg = 0
            AND (
              c.class_id LIKE ?
              OR c.class_name LIKE ?
              OR ca.assignment_name LIKE ?
              OR ca.assignment_type LIKE ?
            )
          ORDER BY c.created_datetime DESC
          `,
          [user_id, keyword, keyword, keyword, keyword],
        );
      } else {
        [rows] = await db.execute(
          `
          SELECT DISTINCT
            c.class_id,
            c.class_name,
            c.class_describe,
            c.created_datetime,
            c.created_by
          FROM classes c
          LEFT JOIN class_assignments ca ON ca.class_id = c.class_id AND ca.deleted_flg = 0
          WHERE c.deleted_flg = 0
            AND (
              c.class_id LIKE ?
              OR c.class_name LIKE ?
              OR ca.assignment_name LIKE ?
              OR ca.assignment_type LIKE ?
            )
          ORDER BY c.created_datetime DESC
          `,
          [keyword, keyword, keyword, keyword],
        );
      }
    }

    return res.json({ data: rows || [] });
  } catch (err) {
    console.error("view classes error:", err);
    return res.status(500).json({ message: "database error" });
  }
};

export const getClassesByCondition = async (req: Request, res: Response) => {
  const { classId } = req.params;
  const conn = await db.getConnection();

  try {
    const [rows]: any = await conn.query(
      `
      SELECT class_id, class_name, class_describe, created_by
      FROM classes
      WHERE deleted_flg = 0 AND class_id = ?
      `,
      [classId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบรายวิชา" });
    }

    res.json({ data: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "database error" });
  } finally {
    conn.release();
  }
};

export const updateClass = async (req: Request, res: Response) => {
  const { classId } = req.params;
  const { class_name, class_describe } = req.body;
  const userId = (req as any).user?.user_id || (req as any).user?.id;
  const userRole = Number((req as any).user?.role);

  const conn = await db.getConnection();

  try {
    const [classRows]: any = await conn.query(
      `SELECT created_by FROM classes WHERE class_id = ? AND deleted_flg = 0`,
      [classId]
    );

    if (classRows.length === 0) {
      return res.status(404).json({ message: "ไม่พบรายวิชา" });
    }

    const isCreator = String(classRows[0].created_by) === String(userId);
    const isAdmin = userRole === 0;
    if (!isCreator && !isAdmin) {
      return res.status(403).json({ message: "ไม่มีสิทธิ์แก้ไขรายวิชานี้" });
    }

    await conn.query(
      `
      UPDATE classes
      SET class_name = ?, class_describe = ?
      WHERE class_id = ? AND deleted_flg = 0
      `,
      [class_name, class_describe, classId],
    );

    res.json({ message: "อัปเดตรายวิชาสำเร็จ" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "database error" });
  } finally {
    conn.release();
  }
};

export const getClassesByUser = async (req: any, res: Response) => {
  const userId = req.user?.user_id || req.user?.id;
  const conn = await db.getConnection();

  try {
    const [rows]: any = await conn.query(
      `
      SELECT c.class_id, c.class_name, c.class_describe, cu.created_datetime
      FROM class_users AS cu 
      INNER JOIN classes AS c ON c.class_id = cu.class_id
      WHERE cu.user_id = ? AND cu.deleted_flg = 0 AND c.deleted_flg = 0
      ORDER BY cu.created_datetime DESC
      `,
      [userId],
    );

    res.json({ data: rows || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "database error" });
  } finally {
    conn.release();
  }
};

export const getClassesByTeacher = async (req: Request, res: Response) => {
  const conn = await db.getConnection();
  const userId = (req as any).user?.user_id || (req as any).user?.id;

  try {
    const [rows]: any = await conn.query(
      `
      SELECT 
        c.class_id,
        c.class_name,
        c.class_describe,
        COUNT(a.assignment_id) AS assignment_count
      FROM classes c
      INNER JOIN class_users cu 
        ON cu.class_id = c.class_id
        AND cu.user_id = ?
        AND cu.view_flg = 0
        AND cu.deleted_flg = 0
      LEFT JOIN class_assignments a
        ON a.class_id = c.class_id
        AND a.deleted_flg = 0
      WHERE c.deleted_flg = 0
      GROUP BY 
        c.class_id,
        c.class_name,
        c.class_describe,
        c.created_datetime
      ORDER BY c.created_datetime DESC;
    `,
      [userId],
    );

    res.json({ data: rows || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "database error" });
  } finally {
    conn.release();
  }
};

export const deletedClass = async (req: Request, res: Response) => {
  const { classId } = req.params;
  const userId = (req as any).user?.user_id || (req as any).user?.id;
  const userRole = Number((req as any).user?.role);

  const conn = await db.getConnection();

  try {
    const [classRows]: any = await conn.query(
      `SELECT created_by FROM classes WHERE class_id = ? AND deleted_flg = 0`,
      [classId]
    );

    if (classRows.length === 0) {
      return res.status(404).json({ message: "ไม่พบรายวิชา" });
    }

    const isCreator = String(classRows[0].created_by) === String(userId);
    const isAdmin = userRole === 0;
    if (!isCreator && !isAdmin) {
      return res.status(403).json({ message: "ไม่มีสิทธิ์ลบรายวิชานี้" });
    }

    await conn.query(
      `
      UPDATE classes
      SET deleted_flg = 1,
          deleted_by = ?
      WHERE class_id = ?
      `,
      [userId, classId]
    );

    res.json({ message: "ลบรายวิชาสำเร็จ" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "database error" });
  } finally {
    conn.release();
  }
};