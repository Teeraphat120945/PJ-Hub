import { Request, Response } from "express";
import { db } from "../db";
import path from "path";
import fs from "fs";

export const createAssignment = async (req: any, res: Response) => {
  const conn = await db.getConnection();

  try {
    const { class_id, title, detail, link, work_type } = req.body;
    const userId = req.user?.user_id || req.user?.id;
    const files = (req.files as Express.Multer.File[]) || [];

    if (!class_id || !title?.trim()) {
      return res.status(400).json({ message: "ข้อมูลไม่ครบถ้วน (กรุณาระบุชื่อผลงาน)" });
    }

    await conn.beginTransaction();

    const [result]: any = await conn.query(
      `
      INSERT INTO class_assignments
      (class_id, assignment_type, assignment_name, assignment_detail, assignment_link, created_by, deleted_flg)
      VALUES (?, ?, ?, ?, ?, ?, 0)
      `,
      [class_id, work_type || "ผลงาน", title.trim(), detail || "", link || null, userId],
    );

    const assignmentId = result.insertId;

    if (files.length > 0) {
      const values = files.map((file) => {
        const originalName = Buffer.from(file.originalname, "latin1").toString("utf8").slice(0, 255);
        return [
          assignmentId,
          originalName,
          file.path,
          file.size,
        ];
      });

      await conn.query(
        `
        INSERT INTO assignment_files
        (assignment_id, file_name, file_path, file_size)
        VALUES ?
        `,
        [values],
      );
    }

    await conn.commit();
    res.json({ message: "สร้างผลงานสำเร็จ", assignmentId });
  } catch (err) {
    await conn.rollback();
    console.error("createAssignment error:", err);
    res.status(500).json({ message: "สร้างผลงานไม่สำเร็จ" });
  } finally {
    conn.release();
  }
};

export const downloadAssignmentFile = async (req: Request, res: Response) => {
  const { fileId } = req.params;
  const userRole = Number((req as any).user?.role);

  if (userRole !== 0 && userRole !== 1 && userRole !== 2) {
    return res.status(403).json({
      message: "สงวนสิทธิ์การดาวน์โหลดไฟล์เฉพาะนิสิตและอาจารย์ในรายวิชาเท่านั้น",
    });
  }

  const conn = await db.getConnection();

  try {
    const [rows]: any = await conn.query(
      `
      SELECT file_name, file_path
      FROM assignment_files
      WHERE file_id = ?
      `,
      [fileId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบไฟล์" });
    }

    const file = rows[0];
    const absolutePath = path.resolve(file.file_path);

    if (!fs.existsSync(absolutePath)) {
      return res.status(404).json({ message: "ไฟล์หายจาก server" });
    }

    return res.download(absolutePath, file.file_name);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "download error" });
  } finally {
    conn.release();
  }
};

export const getAssignment = async (req: any, res: Response) => {
  const conn = await db.getConnection();
  const { classId } = req.params;
  try {
    const [rows]: any = await conn.query(
      `
      SELECT * FROM class_assignments WHERE deleted_flg = 0 AND class_id = ? ORDER BY view_cnt DESC, created_datetime DESC 
      `,
      [classId],
    );

    res.json({ data: rows || [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "database error" });
  } finally {
    conn.release();
  }
};

export const getAssignmentDetail = async (req: any, res: Response) => {
  const conn = await db.getConnection();
  const { assignment_id } = req.params;
  const userRole = Number(req.user?.role);
  const isAuthorized = userRole === 0 || userRole === 1 || userRole === 2;

  try {
    await conn.execute(
      `UPDATE class_assignments 
       SET view_cnt = view_cnt + 1 
       WHERE assignment_id = ?`,
      [assignment_id]
    );

    const [rows]: any = await conn.query(
      `
        SELECT assign.assignment_id, assign.assignment_name, assign.assignment_type, assign.assignment_detail, assign.class_id, assign.assignment_link,
        assign.view_cnt, assign.created_by, assign.created_datetime, files.file_id, files.file_name, files.file_path AS file_url,
        c.created_by AS class_created_by
        FROM class_assignments assign
        LEFT JOIN classes c ON c.class_id = assign.class_id
        LEFT JOIN assignment_files files ON files.assignment_id = assign.assignment_id AND files.deleted_flg = 0
        WHERE assign.deleted_flg = 0 AND assign.assignment_id = ? ;
      `,
      [assignment_id],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบผลงาน" });
    }

    const assignment = {
      assignment_id: rows[0].assignment_id,
      assignment_name: rows[0].assignment_name,
      assignment_type: rows[0].assignment_type,
      assignment_detail: rows[0].assignment_detail,
      class_id: rows[0].class_id,
      class_created_by: rows[0].class_created_by,
      assignment_link: isAuthorized ? rows[0].assignment_link : null,
      view_cnt: rows[0].view_cnt,
      created_by: rows[0].created_by,
      can_access_resources: isAuthorized,
      files: [] as any[],
    };

    for (const row of rows) {
      if (row.file_id) {
        assignment.files.push({
          id: row.file_id,
          name: row.file_name,
          url: isAuthorized ? row.file_url : null,
        });
      }
    }
    res.json({ data: assignment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "database error" });
  } finally {
    conn.release();
  }
};

export const getAssignmentByUser = async (req: any, res: Response) => {
  const conn = await db.getConnection();
  const userId = req.user?.user_id || req.user?.id;
  try {
    const [rows]: any = await conn.query(
      `
      SELECT assignment_id, class_id, assignment_name FROM class_assignments WHERE deleted_flg = 0 AND created_by = ? ORDER BY created_datetime DESC
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

export const updateAssignment = async (req: Request, res: Response) => {
  const conn = await db.getConnection();
  const { assignmentId } = req.params;
  const userId = (req as any).user?.user_id || (req as any).user?.id;
  const userRole = Number((req as any).user?.role);

  try {
    const { class_id, title, detail, link, work_type } = req.body;
    const files = (req.files as Express.Multer.File[]) || [];

    let deletedIds: number[] = [];

    if (!assignmentId || !title?.trim()) {
      return res.status(400).json({ message: "ข้อมูลไม่ครบถ้วน" });
    }

    const [assignRows]: any = await conn.query(
      `SELECT a.created_by, c.created_by AS class_owner
       FROM class_assignments a
       LEFT JOIN classes c ON c.class_id = a.class_id
       WHERE a.assignment_id = ? AND a.deleted_flg = 0`,
      [assignmentId]
    );

    if (assignRows.length === 0) {
      return res.status(404).json({ message: "ไม่พบผลงาน" });
    }

    const isOwner = String(assignRows[0].created_by) === String(userId);
    const isClassOwner = String(assignRows[0].class_owner) === String(userId);
    const isAdmin = userRole === 0;

    if (!isOwner && !isClassOwner && !isAdmin) {
      return res.status(403).json({ message: "ไม่มีสิทธิ์แก้ไขผลงานนี้" });
    }

    const rawDeleted = req.body.deletedFileIds || req.body["deletedFileIds[]"];
    if (rawDeleted) {
      deletedIds = Array.isArray(rawDeleted)
        ? rawDeleted.map((id: string | number) => Number(id)).filter((id: number) => !isNaN(id))
        : [Number(rawDeleted)].filter((id: number) => !isNaN(id));
    }

    await conn.beginTransaction();
    await conn.query(
      `
      UPDATE class_assignments
      SET
        class_id = COALESCE(?, class_id),
        assignment_type = COALESCE(?, assignment_type),
        assignment_name = ?,
        assignment_detail = ?,
        assignment_link = ?,
        updated_datetime = NOW()
      WHERE assignment_id = ? AND deleted_flg = 0
      `,
      [class_id || null, work_type || null, title.trim(), detail || "", link || null, assignmentId],
    );

    if (deletedIds.length > 0) {
      await conn.query(
        `
        UPDATE assignment_files
        SET deleted_flg = 1
        WHERE file_id IN (?)
          AND assignment_id = ?
        `,
        [deletedIds, assignmentId],
      );
    }

    if (files.length > 0) {
      const values = files.map((file) => {
        const originalName = Buffer.from(file.originalname, "latin1").toString("utf8").slice(0, 255);
        return [
          assignmentId,
          originalName,
          file.path,
          file.size,
        ];
      });

      await conn.query(
        `
        INSERT INTO assignment_files
        (assignment_id, file_name, file_path, file_size)
        VALUES ?
        `,
        [values],
      );
    }

    await conn.commit();
    res.json({ message: "แก้ไขผลงานสำเร็จ" });
  } catch (err) {
    await conn.rollback();
    console.error("updateAssignment error:", err);
    res.status(500).json({ message: "แก้ไขผลงานไม่สำเร็จ" });
  } finally {
    conn.release();
  }
};

export const deleteAssignment = async (req: Request, res: Response) => {
  const conn = await db.getConnection();
  const { assignmentId } = req.params;
  const userId = (req as any).user?.user_id || (req as any).user?.id;
  const userRole = Number((req as any).user?.role);

  try {
    const [rows]: any = await conn.query(
      `SELECT a.created_by, c.created_by AS class_owner
       FROM class_assignments a
       LEFT JOIN classes c ON c.class_id = a.class_id
       WHERE a.assignment_id = ? AND a.deleted_flg = 0`,
      [assignmentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบผลงาน" });
    }

    const isOwner = String(rows[0].created_by) === String(userId);
    const isClassOwner = String(rows[0].class_owner) === String(userId);
    const isAdmin = userRole === 0;

    if (!isOwner && !isClassOwner && !isAdmin) {
      return res.status(403).json({ message: "ไม่มีสิทธิ์ลบผลงานนี้" });
    }

    await conn.query(
      `
      UPDATE class_assignments
      SET deleted_by = ?, deleted_flg = 1, updated_datetime = NOW()
      WHERE assignment_id = ?;
      `,
      [userId, assignmentId],
    );

    res.json({ message: "ลบผลงานเรียบร้อย" });
  } catch (err) {
    console.error("deleteAssignment error:", err);
    res.status(500).json({ message: "database error" });
  } finally {
    conn.release();
  }
};