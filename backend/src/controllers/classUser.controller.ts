import { Request, Response } from "express";
import { db } from "../db";

export const getClasses = async (req: Request, res: Response) => {
  const conn = await db.getConnection();
  const user = (req as any).user;

  const userId = user.user_id;
  try {
    const [rows] = await conn.query(
      `SELECT c.class_id, c.class_name
      FROM classes AS c
      LEFT OUTER JOIN class_users AS cu ON cu.class_id = c.class_id 
      WHERE c.deleted_flg = 0 AND cu.user_id = ?
      ORDER BY c.created_datetime DESC`,
      [userId]
    );
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "database error" });
  } finally {
    conn.release();
  }
};

export const getClassUsers = async (req: Request, res: Response) => {
  const conn = await db.getConnection();
  const { classId } = req.params;
  try {
    const [rows] = await conn.query(
    `
    SELECT cu.user_id, u.user_name, cu.view_flg, u.role_flg, roles.role_name
    FROM class_users AS cu
    LEFT JOIN users AS u ON cu.user_id = u.user_id
    LEFT JOIN ref_role as roles ON roles.role_id = u.role_flg
    WHERE u.deleted_flg = 0 and cu.class_id = ?
    GROUP BY  cu.user_id, u.user_name, cu.view_flg, u.role_flg, roles.role_name
    `,
    [classId]
    );
    res.json({ data: rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "database error" });
  } finally {
    conn.release();
  }
};

export const addClassUser = async (req: Request, res: Response) => {
  const { classId } = req.params;
  const { user_id } = req.body;
  const conn = await db.getConnection();

  try {
    const [rows]: any = await conn.query(
      `
      SELECT deleted_flg
      FROM class_users
      WHERE class_id = ?
        AND user_id = ?
      `,
      [classId, user_id]
    );

    if (rows.length > 0) {
      await conn.query(
        `
        UPDATE class_users
        SET deleted_flg = 0,
            view_flg = 0
        WHERE class_id = ?
          AND user_id = ?
        `,
        [classId, user_id]
      );
    } else {
      await conn.query(
        `
        INSERT INTO class_users (class_id, user_id, view_flg, deleted_flg)
        SELECT ?, u.user_id, 0, 0
        FROM users u
        WHERE u.user_id = ?
        `,
        [classId, user_id]
      );
    }

    res.json({ message: "เพิ่มผู้ใช้เข้าคลาสเรียบร้อย" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "database error" });
  } finally {
    conn.release();
  }
};

export const removeUser = async (req: Request, res: Response) => {
  const { classId, userId } = req.params;
  const conn = await db.getConnection();
  const deletedBy = req.user.user_id;
  try {
    await conn.query(
      `
      UPDATE class_users
      SET view_flg = 1,
          deleted_flg = 1,
          deleted_by = ?
      WHERE class_id = ?
        AND user_id = ?
      `,
      [deletedBy, classId, userId]
    );

    res.json({ message: "ลบผู้ใช้ออกจากคลาสเรียบร้อย" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "database error" });
  } finally {
    conn.release();
  }
};


