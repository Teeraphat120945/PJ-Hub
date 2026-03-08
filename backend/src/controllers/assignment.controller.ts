import { Request, Response } from "express";
import { db } from "../db";
import path from "path";
import fs from "fs";

export const createAssignment = async (req: any, res: Response) => {
  const conn = await db.getConnection();

  try {
    const { class_id, title, detail, link, work_type } = req.body;

    const userId = req.user.user_id;
    const files = req.files as Express.Multer.File[];

    if (!class_id || !title ) {
      return res.status(400).json({ message: "ข้อมูลไม่ครบ" });
    }

    const [result]: any = await conn.query(
      `
      INSERT INTO class_assignments
      (class_id, assignment_type, assignment_name, assignment_detail, assignment_link, created_by , deleted_flg)
      VALUES (?, ?, ?, ?, ?, ?, 0)
      `,
      [class_id, work_type, title, detail, link, userId],
    );

    const assignmentId = result.insertId;

    if (files && files.length > 0) {
      const values = files.map((file) => [
        assignmentId,
        file.originalname,
        file.path,
        file.size,
      ]);

      await conn.query(
        `
            INSERT INTO assignment_files
            (assignment_id, file_name, file_path, file_size)
            VALUES ?
            `,
        [values],
      );
    }

    res.json({ message: "สร้างผลงานสำเร็จ" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "สร้างผลงานไม่สำเร็จ" });
  } finally {
    conn.release();
  }
};

export const downloadAssignmentFile = async (req: Request, res: Response) => {
  const { fileId } = req.params;
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
      SELECT * FROM class_assignments WHERE deleted_flg = 0 AND class_id = ? ORDER BY created_datetime DESC, updated_datetime DESC
      `,
      [classId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบผลงาน" });
    }
    res.json({ data: rows });
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
  try {
    const [rows]: any = await conn.query(
      `
        SELECT assign.assignment_id, assign.assignment_name, assign.assignment_type, assign.assignment_detail, assign.class_id, assign.assignment_link,
        assign.created_by, assign.created_datetime, files.file_id, files.file_name, files.file_path AS file_url
        FROM class_assignments assign
        LEFT JOIN assignment_files files ON files.assignment_id = assign.assignment_id AND files.deleted_flg = 0
        WHERE assign.deleted_flg = 0 AND assign.assignment_id = ?;
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
      assignment_link: rows[0].assignment_link,
      created_by: rows[0].created_by,
      files: [] as any[],
    };

    for (const row of rows) {
      if (row.file_id) {
        assignment.files.push({
          id: row.file_id,
          name: row.file_name,
          url: row.file_url,
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
  const userId = req.user.user_id;
  try {
    const [rows]: any = await conn.query(
      `
      SELECT assignment_id, class_id, assignment_name  FROM class_assignments WHERE deleted_flg = 0 AND created_by = ? ORDER BY created_datetime DESC
      `,
      [userId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบผลงาน" });
    }

    res.json({ data: rows });
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
  try {
    const { class_id, title, detail, link, work_type, deletedFileIds } = req.body;
    
    const files = req.files as Express.Multer.File[];


    let deletedIds: number[] = [];

    if (!assignmentId || !class_id || !title || !work_type) {
      return res.status(400).json({ message: "ข้อมูลไม่ครบ" });
    }

    if (req.body.deletedFileIds) {
      deletedIds = Array.isArray(req.body.deletedFileIds)
        ? req.body.deletedFileIds.map((id: string) => Number(id))
        : [Number(req.body.deletedFileIds)];
    }
    
    await conn.beginTransaction();
    await conn.query(
      `
      UPDATE class_assignments
      SET
        class_id = ?,
        assignment_type = ?,
        assignment_name = ?,
        assignment_detail = ?,
        assignment_link = ?,
        updated_datetime = NOW()
        WHERE assignment_id = ? AND deleted_flg = 0
      `,
      [class_id, work_type, title, detail, link, assignmentId],
    );

    if (Array.isArray(deletedFileIds) && deletedFileIds.length > 0) {
      await conn.query(
        `
        UPDATE assignment_files
        SET deleted_flg = 1
        WHERE file_id IN (?)
          AND assignment_id = ?
        `,
        [deletedFileIds, assignmentId],
      );
    }

    if (files && files.length > 0) {
      const values = files.map((file) => [
        assignmentId,
        file.originalname,
        file.path,
        file.size,
      ]);

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
    console.error(err);
    res.status(500).json({ message: "แก้ไขผลงานไม่สำเร็จ" });
  } finally {
    conn.release();
  }
};


export const deleteAssignment = async (req: Request, res: Response) => {
  const conn = await db.getConnection();
  const { assignmentId } = req.params;
  const userId = req.user.user_id;
  try {
    const [result]: any = await conn.query(
      `
    UPDATE class_assignments
    SET deleted_by = ? ,deleted_flg = 1, updated_datetime = NOW()
    WHERE assignment_id = ?;
    `,
      [userId, assignmentId],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "ไม่พบผลงาน" });
    }

    res.json({ message: "ลบผลงานเรียบร้อย" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "database error" });
  } finally {
    conn.release();
  }
};
