import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db";

export const create = async (req: Request, res: Response) => {
  const { classId, className, describe } = req.body;

  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];
  const conn = await db.getConnection();
  if (!token) {
    return res.status(401).json({ message: "unauthorized" });
  }

  const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
  const userId = decoded.user_id;
  const role = decoded.role;
  try {
    await conn.beginTransaction();

    const result = await conn.execute(
      `SELECT user_id FROM users WHERE role_flg = 0`,
    );

    const admins = result[0] as { user_id: number }[];

    await conn.execute(
      `INSERT INTO classes
      (class_id, class_name, class_describe, deleted_flg, created_by)
      VALUES (?, ?, ?, 0, ?)`,
      [classId, className, describe, userId],
    );

    await conn.execute(
      `INSERT INTO class_users
      (class_id, user_id, view_flg, deleted_flg, created_datetime)
      VALUES (?, ?, 0, 0, NOW())`,
      [classId, userId],
    );

    for (const admin of admins) {
      if (admin.user_id === userId) continue;

      await conn.execute(
        `INSERT INTO class_users
        (class_id, user_id, view_flg, deleted_flg, created_datetime)
        VALUES (?, ?, 0, 0, NOW())`,
        [classId, admin.user_id],
      );
    }

    await conn.commit();
    res.status(201).json({ message: "create class success" });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ message: "create class failed" });
  } finally {
    conn.release();
  }
};

export const view = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];
    const search = (req.query.search as string)?.trim();

    let user_id: number | null = null;
    let role: number | null = null;

    if (token) {
      const decoded: any = jwt.verify(token, process.env.JWT_SECRET!);
      user_id = decoded.user_id;
      role = decoded.role;
    }

    const isGuest = role === null || role === 3;

    let rows: any;

    if (!search) {
      if (!isGuest) {
        [rows] = await db.execute(
          `
          SELECT c.class_id, c.class_name, c.class_describe, c.created_datetime
          FROM classes c
          LEFT JOIN class_users cu ON cu.class_id = c.class_id
          WHERE c.deleted_flg = 0
            AND cu.user_id = ?
            AND cu.view_flg = 0
          ORDER BY c.created_datetime DESC
          `,
          [user_id],
        );
      } else {
        [rows] = await db.execute(
          `
          SELECT c.class_id, c.class_name, c.class_describe, c.created_datetime
          FROM classes c
          WHERE c.deleted_flg = 0
          ORDER BY c.created_datetime DESC
          `,
        );
      }
    } else {
      const keyword = `%${search}%`;

      if (!isGuest) {
        [rows] = await db.execute(
          `
          SELECT DISTINCT
            c.class_id,
            c.class_name,
            c.class_describe,
            c.created_datetime
          FROM classes c
          LEFT JOIN class_users cu ON cu.class_id = c.class_id
          LEFT JOIN class_assignments ca ON ca.class_id = c.class_id
          WHERE c.deleted_flg = 0
            AND cu.user_id = ?
            AND cu.view_flg = 0
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
            c.created_datetime
          FROM classes c
          LEFT JOIN class_assignments ca ON ca.class_id = c.class_id
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

    return res.json({ data: rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "database error" });
  }
};

export const getClassesByCondition = async (req: Request, res: Response) => {
  const { classId } = req.params;
  const conn = await db.getConnection();

  try {
    const [rows]: any = await conn.query(
      `
      SELECT class_id, class_name, class_describe
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

  const conn = await db.getConnection();

  try {
    const [result]: any = await conn.query(
      `
      UPDATE classes
      SET class_name = ?, class_describe = ?
      WHERE class_id = ? AND deleted_flg = 0
      `,
      [class_name, class_describe, classId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "ไม่พบรายวิชา" });
    }

    res.json({ message: "อัปเดตรายวิชาสำเร็จ" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "database error" });
  } finally {
    conn.release();
  }
};

export const getClassesByUser = async (req: any, res: Response) => {
  const userId = req.user.user_id;
  const conn = await db.getConnection();

  try {
    const [rows]: any = await conn.query(
      `
      SELECT * FROM class_users AS cu 
      LEFT OUTER JOIN classes AS c ON c.class_id = cu.class_id
      WHERE cu.user_id = ?
      ORDER BY cu.created_datetime
      `,
      [userId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบรายวิชา" });
    }

    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "database error" });
  } finally {
    conn.release();
  }
};

export const getClassesByTeacher = async (req: Request, res: Response) => {
  const conn = await db.getConnection();
  const userId = req.user.user_id;

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

    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "database error" });
  } finally {
    conn.release();
  }
};

export const deletedClass = async (req: Request, res: Response) => {
  const { classId } = req.params;
  const userId = req.user.user_id;

  const conn = await db.getConnection();

  try {
    const [result]: any = await conn.query(
      `
      UPDATE classes
      SET deleted_flg = 1,
          deleted_by = ?
      WHERE class_id = ?
      `,
      [userId, classId]
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ message: "ไม่พบรายวิชา" });
    }

    res.json({ message: "ลบรายวิชาสำเร็จ" });
  } catch (err) {
    console.error(err);
    res
      .status(500)
      .json({ message: "database error" });
  } finally {
    conn.release();
  }
};