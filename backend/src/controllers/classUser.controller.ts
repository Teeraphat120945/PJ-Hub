import { Request, Response } from "express";
import { db } from "../db";

export const getClasses = async (req: Request, res: Response) => {
  const conn = await db.getConnection();
  const user = (req as any).user;

  const userId = user?.user_id || user?.id;
  const tokenRole = Number(user?.role);
  try {
    let currentRole = tokenRole;
    if (userId) {
      const [userRows]: any = await conn.query(
        "SELECT role_flg FROM users WHERE user_id = ? AND deleted_flg = 0",
        [userId]
      );
      if (userRows.length > 0 && userRows[0].role_flg !== undefined && userRows[0].role_flg !== null) {
        currentRole = Number(userRows[0].role_flg);
      }
    }

    if (currentRole === 0) {
      const [rows] = await conn.query(
        `SELECT c.class_id, c.class_name
        FROM classes AS c
        WHERE c.deleted_flg = 0
        ORDER BY c.created_datetime DESC`
      );
      return res.json({ data: rows || [] });
    }

    const [rows] = await conn.query(
      `SELECT DISTINCT c.class_id, c.class_name
      FROM classes AS c
      LEFT OUTER JOIN class_users AS cu ON cu.class_id = c.class_id AND cu.deleted_flg = 0 AND cu.user_id = ?
      WHERE c.deleted_flg = 0 AND (cu.user_id IS NOT NULL OR c.created_by = ?)
      ORDER BY c.created_datetime DESC`,
      [userId, userId]
    );
    res.json({ data: rows || [] });
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
  const requesterId = (req as any).user?.user_id || (req as any).user?.id;
  const requesterRole = Number((req as any).user?.role);

  try {
    let currentRole = requesterRole;
    if (requesterId) {
      const [userRows]: any = await conn.query(
        "SELECT role_flg FROM users WHERE user_id = ? AND deleted_flg = 0",
        [requesterId]
      );
      if (userRows.length > 0 && userRows[0].role_flg !== undefined && userRows[0].role_flg !== null) {
        currentRole = Number(userRows[0].role_flg);
      }
    }

    if (currentRole !== 0) {
      const [classRows]: any = await conn.query(
        "SELECT created_by FROM classes WHERE class_id = ? AND deleted_flg = 0",
        [classId]
      );
      if (classRows.length === 0) {
        return res.status(404).json({ message: "ไม่พบรายวิชา" });
      }

      const isCreator = String(classRows[0].created_by) === String(requesterId);
      const [membership]: any = await conn.query(
        "SELECT 1 FROM class_users WHERE class_id = ? AND user_id = ? AND deleted_flg = 0",
        [classId, requesterId]
      );

      if (!isCreator && membership.length === 0) {
        return res.status(403).json({ message: "ไม่มีสิทธิ์เข้าถึงรายชื่อสมาชิกในรายวิชานี้" });
      }
    }

    const [rows] = await conn.query(
      `
      SELECT cu.user_id, u.user_name, cu.view_flg, u.role_flg, roles.role_name
      FROM class_users AS cu
      LEFT JOIN users AS u ON cu.user_id = u.user_id
      LEFT JOIN ref_role as roles ON roles.role_id = u.role_flg
      WHERE u.deleted_flg = 0 AND cu.deleted_flg = 0 AND cu.class_id = ?
      GROUP BY cu.user_id, u.user_name, cu.view_flg, u.role_flg, roles.role_name
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
  const requesterId = (req as any).user?.user_id || (req as any).user?.id;
  const requesterRole = Number((req as any).user?.role);
  const conn = await db.getConnection();

  try {
    const [classRows]: any = await conn.query(
      "SELECT created_by FROM classes WHERE class_id = ? AND deleted_flg = 0",
      [classId]
    );
    if (classRows.length === 0) {
      return res.status(404).json({ message: "ไม่พบรายวิชา" });
    }

    let currentRole = requesterRole;
    if (requesterId) {
      const [userRows]: any = await conn.query(
        "SELECT role_flg FROM users WHERE user_id = ? AND deleted_flg = 0",
        [requesterId]
      );
      if (userRows.length > 0 && userRows[0].role_flg !== undefined && userRows[0].role_flg !== null) {
        currentRole = Number(userRows[0].role_flg);
      }
    }

    const isCreator = String(classRows[0].created_by) === String(requesterId);
    const isAdmin = currentRole === 0;
    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        message: "สงวนสิทธิ์เฉพาะอาจารย์ผู้รับผิดชอบรายวิชาหรือผู้ดูแลระบบเท่านั้น",
      });
    }

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
  const requesterId = (req as any).user?.user_id || (req as any).user?.id;
  const requesterRole = Number((req as any).user?.role);
  const conn = await db.getConnection();

  try {
    const [classRows]: any = await conn.query(
      "SELECT created_by FROM classes WHERE class_id = ? AND deleted_flg = 0",
      [classId]
    );
    if (classRows.length === 0) {
      return res.status(404).json({ message: "ไม่พบรายวิชา" });
    }

    let currentRole = requesterRole;
    if (requesterId) {
      const [userRows]: any = await conn.query(
        "SELECT role_flg FROM users WHERE user_id = ? AND deleted_flg = 0",
        [requesterId]
      );
      if (userRows.length > 0 && userRows[0].role_flg !== undefined && userRows[0].role_flg !== null) {
        currentRole = Number(userRows[0].role_flg);
      }
    }

    const isCreator = String(classRows[0].created_by) === String(requesterId);
    const isAdmin = currentRole === 0;
    if (!isCreator && !isAdmin) {
      return res.status(403).json({
        message: "สงวนสิทธิ์เฉพาะอาจารย์ผู้รับผิดชอบรายวิชาหรือผู้ดูแลระบบเท่านั้น",
      });
    }

    const [targetUsers]: any = await conn.query(
      `SELECT role_flg FROM users WHERE user_id = ?`,
      [userId]
    );

    if (targetUsers.length > 0 && Number(targetUsers[0].role_flg) === 0) {
      return res.status(403).json({
        message: "ไม่สามารถลบผู้ดูแลระบบ (Admin) ออกจากรายวิชาได้",
      });
    }

    await conn.query(
      `
      UPDATE class_users
      SET view_flg = 1,
          deleted_flg = 1,
          deleted_by = ?
      WHERE class_id = ?
        AND user_id = ?
      `,
      [requesterId, classId, userId]
    );

    res.json({ message: "ลบผู้ใช้ออกจากคลาสเรียบร้อย" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "database error" });
  } finally {
    conn.release();
  }
};




