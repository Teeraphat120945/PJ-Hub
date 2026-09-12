import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { db } from "../db";

const JWT_SECRET = process.env.JWT_SECRET || "classroom_jwt_secret_key_2026";

/**
 * ฟังก์ชันซิงค์แอดมินทุกคน (รวมถึงผู้ได้รับการแต่งตั้งใหม่ในภายหลัง) เข้า class_users
 * เพื่อให้ Admin ทุกคนมีสิทธิ์เข้าถึง ดูแล และเห็นข้อมูลรายวิชาทั้งหมดเหมือนกับ Admin เดิม
 */
export const syncAdminsToClasses = async (conn: any) => {
  try {
    await conn.query(`
      INSERT INTO class_users (class_id, user_id, view_flg, deleted_flg, created_datetime)
      SELECT c.class_id, u.user_id, 0, 0, NOW()
      FROM classes c
      CROSS JOIN users u
      LEFT JOIN class_users cu ON cu.class_id = c.class_id AND cu.user_id = u.user_id
      WHERE c.deleted_flg = 0 
        AND u.role_flg = 0 
        AND u.deleted_flg = 0
        AND cu.class_id IS NULL;
    `);

    await conn.query(`
      UPDATE class_users cu
      INNER JOIN users u ON u.user_id = cu.user_id
      INNER JOIN classes c ON c.class_id = cu.class_id
      SET cu.deleted_flg = 0, cu.view_flg = 0
      WHERE u.role_flg = 0 
        AND u.deleted_flg = 0 
        AND c.deleted_flg = 0 
        AND cu.deleted_flg = 1;
    `);
  } catch (syncErr) {
    console.warn("syncAdminsToClasses warning:", syncErr);
  }
};

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

    if (user_id) {
      try {
        const [uRows]: any = await db.execute(
          "SELECT role_flg FROM users WHERE user_id = ? AND deleted_flg = 0",
          [user_id]
        );
        if (uRows.length > 0 && uRows[0].role_flg !== undefined && uRows[0].role_flg !== null) {
          role = Number(uRows[0].role_flg);
        }
      } catch (err) {
        console.warn("view fetch role error:", err);
      }
    }

    let rows: any;

    if (!search) {
      if (user_id) {
        [rows] = await db.execute(
          `
          SELECT c.class_id, c.class_name, c.class_describe, c.created_datetime, c.created_by,
            CASE
              WHEN ? = 0 THEN 1
              WHEN c.created_by = ? THEN 1
              WHEN cu.user_id IS NOT NULL AND ? = 1 THEN 1
              ELSE 0
            END AS is_responsible,
            CASE
              WHEN ? = 0 THEN 1
              WHEN cu.user_id IS NOT NULL OR c.created_by = ? THEN 1
              ELSE 0
            END AS is_enrolled,
            NULL AS matched_types
          FROM classes c
          LEFT JOIN class_users cu ON cu.class_id = c.class_id AND cu.user_id = ? AND cu.view_flg = 0 AND cu.deleted_flg = 0
          WHERE c.deleted_flg = 0
          ORDER BY c.created_datetime DESC
          `,
          [role, user_id, role, role, user_id, user_id],
        );
      } else {
        [rows] = await db.execute(
          `
          SELECT c.class_id, c.class_name, c.class_describe, c.created_datetime, c.created_by,
            0 AS is_responsible,
            0 AS is_enrolled,
            NULL AS matched_types
          FROM classes c
          WHERE c.deleted_flg = 0
          ORDER BY c.created_datetime DESC
          `,
        );
      }
    } else {
      const keyword = `%${search}%`;

      // ตรวจสอบว่าคำค้นหามีปี พ.ศ. (ตัวเลข 4 หลัก ≥ 2500) หรือไม่
      const buddhistYearMatch = search.match(/(\d{4})/);
      let ceYear: number | null = null;
      if (buddhistYearMatch) {
        const yearNum = parseInt(buddhistYearMatch[1], 10);
        if (yearNum >= 2500) {
          ceYear = yearNum - 543; // แปลง พ.ศ. → ค.ศ.
        }
      }

      if (user_id) {
        const yearCondition = ceYear !== null ? `OR YEAR(c.created_datetime) = ?` : ``;
        const yearParams = ceYear !== null ? [ceYear] : [];
        [rows] = await db.execute(
          `
          SELECT
            c.class_id,
            c.class_name,
            c.class_describe,
            c.created_datetime,
            c.created_by,
            CASE
              WHEN ? = 0 THEN 1
              WHEN c.created_by = ? THEN 1
              WHEN cu.user_id IS NOT NULL AND ? = 1 THEN 1
              ELSE 0
            END AS is_responsible,
            CASE
              WHEN ? = 0 THEN 1
              WHEN cu.user_id IS NOT NULL OR c.created_by = ? THEN 1
              ELSE 0
            END AS is_enrolled,
            GROUP_CONCAT(DISTINCT CASE WHEN ca.assignment_type LIKE ? OR ca.assignment_name LIKE ? THEN ca.assignment_type ELSE NULL END SEPARATOR ', ') AS matched_types
          FROM classes c
          LEFT JOIN class_users cu ON cu.class_id = c.class_id AND cu.user_id = ? AND cu.view_flg = 0 AND cu.deleted_flg = 0
          LEFT JOIN class_assignments ca ON ca.class_id = c.class_id AND ca.deleted_flg = 0
          WHERE c.deleted_flg = 0
            AND (
              c.class_id LIKE ?
              OR c.class_name LIKE ?
              OR c.class_describe LIKE ?
              OR ca.assignment_name LIKE ?
              OR ca.assignment_type LIKE ?
              ${yearCondition}
            )
          GROUP BY c.class_id, c.class_name, c.class_describe, c.created_datetime, c.created_by, cu.user_id
          ORDER BY c.created_datetime DESC
          `,
          [role, user_id, role, role, user_id, keyword, keyword, user_id, keyword, keyword, keyword, keyword, keyword, ...yearParams],
        );
      } else {
        const yearCondition = ceYear !== null ? `OR YEAR(c.created_datetime) = ?` : ``;
        const yearParams = ceYear !== null ? [ceYear] : [];
        [rows] = await db.execute(
          `
          SELECT
            c.class_id,
            c.class_name,
            c.class_describe,
            c.created_datetime,
            c.created_by,
            0 AS is_responsible,
            0 AS is_enrolled,
            GROUP_CONCAT(DISTINCT CASE WHEN ca.assignment_type LIKE ? OR ca.assignment_name LIKE ? THEN ca.assignment_type ELSE NULL END SEPARATOR ', ') AS matched_types
          FROM classes c
          LEFT JOIN class_assignments ca ON ca.class_id = c.class_id AND ca.deleted_flg = 0
          WHERE c.deleted_flg = 0
            AND (
              c.class_id LIKE ?
              OR c.class_name LIKE ?
              OR c.class_describe LIKE ?
              OR ca.assignment_name LIKE ?
              OR ca.assignment_type LIKE ?
              ${yearCondition}
            )
          GROUP BY c.class_id, c.class_name, c.class_describe, c.created_datetime, c.created_by
          ORDER BY c.created_datetime DESC
          `,
          [keyword, keyword, keyword, keyword, keyword, keyword, keyword, ...yearParams],
        );
      }
    }

    const formattedRows = (rows || []).map((r: any) => ({
      ...r,
      is_responsible: Boolean(r.is_responsible),
      is_enrolled: Boolean(r.is_enrolled),
    }));

    return res.json({ data: formattedRows });
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
      SELECT class_id, class_name, class_describe, created_datetime, created_by
      FROM classes
      WHERE deleted_flg = 0 AND class_id = ?
      `,
      [classId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบรายวิชา" });
    }

    const classData = rows[0];
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    let userId: string | null = null;
    let role: number | null = null;

    if (token) {
      try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        userId = decoded.user_id;
        role = Number(decoded.role);
      } catch {
        userId = null;
        role = null;
      }
    }

    let isResponsible = false;
    let isEnrolled = false;

    if (userId) {
      let currentRole = role;
      const [userRows]: any = await conn.query(
        "SELECT role_flg FROM users WHERE user_id = ? AND deleted_flg = 0",
        [userId]
      );
      if (userRows.length > 0 && userRows[0].role_flg !== undefined && userRows[0].role_flg !== null) {
        currentRole = Number(userRows[0].role_flg);
      }

      const isAdmin = currentRole === 0;
      const isCreator = String(classData.created_by) === String(userId);

      if (isAdmin || isCreator) {
        isResponsible = true;
        isEnrolled = true;
      } else {
        const [membership]: any = await conn.query(
          `
          SELECT cu.user_id, u.role_flg
          FROM class_users cu
          INNER JOIN users u ON u.user_id = cu.user_id
          WHERE cu.class_id = ? AND cu.user_id = ? AND cu.deleted_flg = 0
          `,
          [classId, userId],
        );

        if (membership.length > 0) {
          isEnrolled = true;
          if (role === 1 || Number(membership[0].role_flg) === 1) {
            isResponsible = true;
          }
        }
      }
    }

    res.json({
      data: {
        ...classData,
        is_responsible: isResponsible,
        is_enrolled: isEnrolled,
      },
    });
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

    let currentRole = userRole;
    if (userId) {
      const [userRows]: any = await conn.query(
        "SELECT role_flg FROM users WHERE user_id = ? AND deleted_flg = 0",
        [userId]
      );
      if (userRows.length > 0 && userRows[0].role_flg !== undefined && userRows[0].role_flg !== null) {
        currentRole = Number(userRows[0].role_flg);
      }
    }

    const isCreator = String(classRows[0].created_by) === String(userId);
    const isAdmin = currentRole === 0;
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
  const tokenRole = Number(req.user?.role);
  const conn = await db.getConnection();

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

    let rows: any;
    if (currentRole === 0) {
      // ผู้ดูแลระบบ (Admin): สามารถเข้าถึงและเลือกรายวิชาได้ทุกรายวิชาในระบบ
      [rows] = await conn.query(
        `
        SELECT c.class_id, c.class_name, c.class_describe, c.created_datetime
        FROM classes AS c
        WHERE c.deleted_flg = 0
        ORDER BY c.created_datetime DESC
        `
      );
    } else {
      [rows] = await conn.query(
        `
        SELECT c.class_id, c.class_name, c.class_describe, cu.created_datetime
        FROM class_users AS cu 
        INNER JOIN classes AS c ON c.class_id = cu.class_id
        WHERE cu.user_id = ? AND cu.deleted_flg = 0 AND c.deleted_flg = 0
        ORDER BY cu.created_datetime DESC
        `,
        [userId],
      );
    }

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
  const tokenRole = Number((req as any).user?.role);

  try {
    // 1. ซิงค์สิทธิ์ Admin ทุกคนเข้า class_users ทุกวิชาโดยอัตโนมัติ
    await syncAdminsToClasses(conn);

    // 2. ดึง role ล่าสุดจาก DB
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

    let rows: any;
    if (currentRole === 0) {
      // สำหรับผู้ดูแลระบบ (Admin): มีสิทธิ์กำกับดูแลและเห็นรายวิชาทั้งหมดในระบบที่ยังไม่ถูกลบ
      [rows] = await conn.query(
        `
        SELECT 
          c.class_id,
          c.class_name,
          c.class_describe,
          c.created_datetime,
          COUNT(a.assignment_id) AS assignment_count
        FROM classes c
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
        `
      );
    } else {
      // สำหรับอาจารย์ (Teacher): เห็นเฉพาะรายวิชาที่ตนเองรับผิดชอบหรือเป็นผู้สร้าง
      [rows] = await conn.query(
        `
        SELECT 
          c.class_id,
          c.class_name,
          c.class_describe,
          c.created_datetime,
          COUNT(a.assignment_id) AS assignment_count
        FROM classes c
        LEFT JOIN class_users cu 
          ON cu.class_id = c.class_id
          AND cu.user_id = ?
          AND cu.view_flg = 0
          AND cu.deleted_flg = 0
        LEFT JOIN class_assignments a
          ON a.class_id = c.class_id
          AND a.deleted_flg = 0
        WHERE c.deleted_flg = 0
          AND (cu.user_id IS NOT NULL OR c.created_by = ?)
        GROUP BY 
          c.class_id,
          c.class_name,
          c.class_describe,
          c.created_datetime
        ORDER BY c.created_datetime DESC;
        `,
        [userId, userId],
      );
    }

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
  const tokenRole = Number((req as any).user?.role);

  const conn = await db.getConnection();

  try {
    const [classRows]: any = await conn.query(
      `SELECT created_by FROM classes WHERE class_id = ? AND deleted_flg = 0`,
      [classId]
    );

    if (classRows.length === 0) {
      return res.status(404).json({ message: "ไม่พบรายวิชา" });
    }

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

    const isCreator = String(classRows[0].created_by) === String(userId);
    const isAdmin = currentRole === 0;
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