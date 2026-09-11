import { Request, Response } from "express";
import { db } from "../db";
import path from "path";
import fs from "fs";

export const createAssignment = async (req: any, res: Response) => {
  const conn = await db.getConnection();

  try {
    const { class_id, title, detail, link, work_type } = req.body;
    const userId = req.user?.user_id || req.user?.id;
    const userRole = Number(req.user?.role);
    const files = (req.files as Express.Multer.File[]) || [];

    if (userRole !== 0 && userRole !== 1 && userRole !== 2) {
      return res.status(403).json({
        message: "สงวนสิทธิ์การส่งผลงานเฉพาะนิสิตและอาจารย์ในรายวิชาเท่านั้น",
      });
    }

    if (!class_id || !title?.trim()) {
      return res.status(400).json({ message: "ข้อมูลไม่ครบถ้วน (กรุณาระบุชื่อผลงานและรายวิชา)" });
    }

    const [classRows]: any = await conn.query(
      "SELECT created_by FROM classes WHERE class_id = ? AND deleted_flg = 0",
      [class_id]
    );

    if (classRows.length === 0) {
      return res.status(404).json({ message: "ไม่พบรายวิชาที่ระบุ" });
    }

    if (userRole !== 0) {
      const isClassCreator = String(classRows[0].created_by) === String(userId);
      const [enrolled]: any = await conn.query(
        "SELECT 1 FROM class_users WHERE class_id = ? AND user_id = ? AND deleted_flg = 0",
        [class_id, userId]
      );

      if (!isClassCreator && enrolled.length === 0) {
        return res.status(403).json({
          message: "คุณไม่ได้เป็นสมาชิกในรายวิชานี้ จึงไม่สามารถสร้างหรือส่งผลงานได้",
        });
      }
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
  const userId = (req as any).user?.user_id || (req as any).user?.id;
  const tokenRole = Number((req as any).user?.role);

  const conn = await db.getConnection();

  try {
    // 1. ค้นหาข้อมูลไฟล์ โครงงาน และรายวิชา
    const [rows]: any = await conn.query(
      `
      SELECT f.file_name, f.file_path, a.assignment_id, a.created_by AS assignment_created_by,
             a.class_id, c.created_by AS class_created_by
      FROM assignment_files f
      JOIN class_assignments a ON a.assignment_id = f.assignment_id
      LEFT JOIN classes c ON c.class_id = a.class_id
      WHERE f.file_id = ? AND f.deleted_flg = 0 AND a.deleted_flg = 0
      `,
      [fileId],
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบไฟล์ที่ต้องการดาวน์โหลด" });
    }

    const file = rows[0];

    // 2. ดึง role ปัจจุบันจากฐานข้อมูล เพื่อให้ข้อมูลสิทธิ์เป็นปัจจุบันเสมอ
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

    const isWorkOwner = Boolean(userId && String(file.assignment_created_by) === String(userId));
    const isClassOwner = Boolean(userId && String(file.class_created_by) === String(userId));
    const isAdmin = currentRole === 0;
    const isTeacherOrStudent = currentRole === 1 || currentRole === 2;

    let isEnrolled = false;
    if (userId && file.class_id) {
      const [enrolledRows]: any = await conn.query(
        "SELECT 1 FROM class_users WHERE class_id = ? AND user_id = ? AND deleted_flg = 0",
        [file.class_id, userId]
      );
      isEnrolled = enrolledRows.length > 0;
    }

    const canDownload = isAdmin || isWorkOwner || isClassOwner || isEnrolled || isTeacherOrStudent;

    if (!canDownload) {
      return res.status(403).json({
        message: "สงวนสิทธิ์การดาวน์โหลดไฟล์เฉพาะผู้มีสิทธิ์เข้าถึงข้อมูลผลงานนี้เท่านั้น",
      });
    }

    // 3. ค้นหาตำแหน่งไฟล์จริงบนเครื่องเซิร์ฟเวอร์ (รองรับทั้ง CWD root และ CWD backend)
    const baseName = path.basename(file.file_path);
    const candidatePaths = [
      path.resolve(file.file_path),
      path.resolve(process.cwd(), file.file_path),
      path.resolve(process.cwd(), "backend", file.file_path),
      path.resolve(__dirname, "../../uploads/assignments", baseName),
      path.resolve(__dirname, "../uploads/assignments", baseName),
      path.resolve(process.cwd(), "uploads/assignments", baseName),
      path.resolve(process.cwd(), "backend/uploads/assignments", baseName),
    ];

    const absolutePath = candidatePaths.find((p) => fs.existsSync(p));

    if (!absolutePath) {
      console.error(`File missing on disk for file_id ${fileId}:`, file.file_path, candidatePaths);
      return res.status(404).json({ message: "ไม่พบไฟล์บนเซิร์ฟเวอร์ (ไฟล์อาจถูกย้ายหรือลบ)" });
    }

    return res.download(absolutePath, file.file_name, (err) => {
      if (err && !res.headersSent) {
        console.error("res.download error:", err);
        res.status(500).json({ message: "เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์" });
      }
    });
  } catch (err) {
    console.error("downloadAssignmentFile error:", err);
    res.status(500).json({ message: "เกิดข้อผิดพลาดในการดาวน์โหลดไฟล์" });
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
  const tokenRole = Number(req.user?.role);
  const userId: string | null = req.user?.user_id || req.user?.id || null;

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

    // ตรวจสอบ role ล่าสุดจาก DB เพื่อความแม่นยำ
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

    const isWorkOwner = Boolean(userId && String(rows[0].created_by) === String(userId));
    const isClassOwner = Boolean(userId && String(rows[0].class_created_by) === String(userId));
    const isAdmin = currentRole === 0;
    const isTeacherOrStudent = currentRole === 1 || currentRole === 2;

    let isEnrolled = false;
    let isEnrolledInstructor = false;
    if (userId && rows[0].class_id) {
      const [enrolledRows]: any = await conn.query(
        `SELECT cu.user_id, u.role_flg FROM class_users cu
         INNER JOIN users u ON u.user_id = cu.user_id
         WHERE cu.class_id = ? AND cu.user_id = ? AND cu.deleted_flg = 0`,
        [rows[0].class_id, userId]
      );
      if (enrolledRows.length > 0) {
        isEnrolled = true;
        isEnrolledInstructor = Number(enrolledRows[0].role_flg) === 1;
      }
    }

    const isAuthorized = isAdmin || isWorkOwner || isClassOwner || isEnrolled || isTeacherOrStudent;

    const isClassResponsible = isClassOwner || isEnrolledInstructor || isAdmin;
    const canComment = isWorkOwner || isClassResponsible;
    const canEdit = isWorkOwner || isClassResponsible;
    const canDelete = isWorkOwner || isClassResponsible;

    const createdDate = rows[0].created_datetime ? new Date(rows[0].created_datetime) : null;
    const retentionDays = 365;
    let expiresAt: string | null = null;
    let daysRemaining: number | null = null;
    let isExpired = false;
    let isExpiringSoon = false;

    if (createdDate && !isNaN(createdDate.getTime())) {
      const expiryTime = createdDate.getTime() + retentionDays * 24 * 60 * 60 * 1000;
      expiresAt = new Date(expiryTime).toISOString();
      const diffMs = expiryTime - Date.now();
      daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      isExpired = daysRemaining <= 0;
      isExpiringSoon = daysRemaining > 0 && daysRemaining <= 30;
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
      created_datetime: rows[0].created_datetime,
      retention_days: retentionDays,
      expires_at: expiresAt,
      days_remaining: daysRemaining,
      is_expired: isExpired,
      is_expiring_soon: isExpiringSoon,
      can_access_resources: isAuthorized,
      is_work_owner: isWorkOwner,
      is_class_responsible: isClassResponsible,
      can_comment: canComment,
      can_edit: canEdit,
      can_delete: canDelete,
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
      SELECT assignment_id, class_id, assignment_name, created_datetime FROM class_assignments WHERE deleted_flg = 0 AND created_by = ? ORDER BY created_datetime DESC
      `,
      [userId],
    );

    const retentionDays = 365;
    const now = Date.now();
    const formatted = (rows || []).map((row: any) => {
      let expiresAt: string | null = null;
      let daysRemaining: number | null = null;
      let isExpired = false;
      let isExpiringSoon = false;

      if (row.created_datetime) {
        const createdDate = new Date(row.created_datetime);
        if (!isNaN(createdDate.getTime())) {
          const expiryTime = createdDate.getTime() + retentionDays * 24 * 60 * 60 * 1000;
          expiresAt = new Date(expiryTime).toISOString();
          const diffMs = expiryTime - now;
          daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          isExpired = daysRemaining <= 0;
          isExpiringSoon = daysRemaining > 0 && daysRemaining <= 30;
        }
      }

      return {
        ...row,
        retention_days: retentionDays,
        expires_at: expiresAt,
        days_remaining: daysRemaining,
        is_expired: isExpired,
        is_expiring_soon: isExpiringSoon,
      };
    });

    res.json({ data: formatted });
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
      `SELECT a.created_by, c.created_by AS class_owner, a.class_id
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

    let isEnrolledInstructor = false;
    if (!isOwner && !isClassOwner && !isAdmin && userId) {
      const [instructorRows]: any = await conn.query(
        `SELECT 1 FROM class_users cu
         INNER JOIN users u ON u.user_id = cu.user_id
         WHERE cu.class_id = ? AND cu.user_id = ? AND cu.deleted_flg = 0 AND u.role_flg = 1`,
        [assignRows[0].class_id, userId],
      );
      isEnrolledInstructor = instructorRows.length > 0;
    }

    if (!isOwner && !isClassOwner && !isAdmin && !isEnrolledInstructor) {
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
      `SELECT a.created_by, c.created_by AS class_owner, a.class_id
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

    let isEnrolledInstructor = false;
    if (!isOwner && !isClassOwner && !isAdmin && userId) {
      const [instructorRows]: any = await conn.query(
        `SELECT 1 FROM class_users cu
         INNER JOIN users u ON u.user_id = cu.user_id
         WHERE cu.class_id = ? AND cu.user_id = ? AND cu.deleted_flg = 0 AND u.role_flg = 1`,
        [rows[0].class_id, userId],
      );
      isEnrolledInstructor = instructorRows.length > 0;
    }

    if (!isOwner && !isClassOwner && !isAdmin && !isEnrolledInstructor) {
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

export const searchAssignments = async (req: Request, res: Response) => {
  const search = (req.query.search as string)?.trim();
  if (!search) {
    return res.json({ data: [] });
  }

  const keyword = `%${search}%`;
  const buddhistYearMatch = search.match(/(\d{4})/);
  let ceYear: number | null = null;
  if (buddhistYearMatch) {
    const yearNum = parseInt(buddhistYearMatch[1], 10);
    if (yearNum >= 2500) {
      ceYear = yearNum - 543;
    }
  }

  const yearCondition = ceYear !== null ? `OR YEAR(a.created_datetime) = ?` : ``;
  const yearParams = ceYear !== null ? [ceYear] : [];

  const conn = await db.getConnection();
  try {
    const [rows]: any = await conn.execute(
      `
      SELECT 
        a.assignment_id,
        a.assignment_name,
        a.assignment_type,
        a.assignment_detail,
        a.created_datetime,
        a.view_cnt,
        a.class_id,
        c.class_name
      FROM class_assignments a
      INNER JOIN classes c ON c.class_id = a.class_id AND c.deleted_flg = 0
      WHERE a.deleted_flg = 0
        AND (
          a.assignment_name LIKE ?
          OR a.assignment_type LIKE ?
          OR a.assignment_detail LIKE ?
          OR a.class_id LIKE ?
          OR c.class_name LIKE ?
          ${yearCondition}
        )
      ORDER BY a.created_datetime DESC, a.view_cnt DESC
      LIMIT 24
      `,
      [keyword, keyword, keyword, keyword, keyword, ...yearParams]
    );

    res.json({ data: rows || [] });
  } catch (err) {
    console.error("searchAssignments error:", err);
    res.status(500).json({ message: "database error" });
  } finally {
    conn.release();
  }
};

export const checkAssignmentLink = async (req: Request, res: Response) => {
  const { url } = req.body;

  if (!url || typeof url !== "string" || !url.trim()) {
    return res.status(400).json({
      is_healthy: false,
      status_code: null,
      reason: "invalid_url",
      message: "ไม่พบ URL ลิงก์ที่ต้องการตรวจสอบ",
    });
  }

  let testUrl = url.trim();
  if (!/^https?:\/\//i.test(testUrl)) {
    testUrl = `https://${testUrl}`;
  }

  try {
    const parsed = new URL(testUrl);
    if (!parsed.hostname || !parsed.hostname.includes(".")) {
      return res.json({
        is_healthy: false,
        status_code: null,
        reason: "invalid_domain",
        message: "รูปแบบโดเมนหรือ URL ไม่ถูกต้อง",
        tested_url: testUrl,
      });
    }

    let responseStatus: number | null = null;
    let ok = false;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const resp = await fetch(testUrl, {
        method: "HEAD",
        signal: controller.signal,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
        redirect: "follow",
      });

      clearTimeout(timeoutId);
      responseStatus = resp.status;
      ok = resp.ok;

      // บางบริการ (เช่น Google Drive, GitHub) ปฏิเสธ HEAD ด้วยรหัส 405 Method Not Allowed หรือ 400 ให้ fallback ด้วย GET สั้นๆ
      if (resp.status === 405 || resp.status === 400) {
        const getController = new AbortController();
        const getTimeoutId = setTimeout(() => getController.abort(), 6000);
        const getResp = await fetch(testUrl, {
          method: "GET",
          signal: getController.signal,
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
            "Range": "bytes=0-100",
          },
          redirect: "follow",
        });
        clearTimeout(getTimeoutId);
        responseStatus = getResp.status;
        ok = getResp.ok;
      }
    } catch (fetchErr: any) {
      if (fetchErr?.name === "AbortError") {
        return res.json({
          is_healthy: false,
          status_code: null,
          reason: "timeout",
          message: "การเชื่อมต่อหมดเวลา (Timeout) เซิร์ฟเวอร์ปลายทางตอบสนองช้าหรือไม่สามารถเข้าถึงได้",
          tested_url: testUrl,
        });
      }

      return res.json({
        is_healthy: false,
        status_code: null,
        reason: "network_error",
        message: "ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ปลายทางได้ ลิงก์อาจเสีย โดเมนหมดอายุ หรือถูกลบไปแล้ว",
        tested_url: testUrl,
      });
    }

    if (responseStatus !== null && responseStatus >= 200 && responseStatus < 400) {
      return res.json({
        is_healthy: true,
        status_code: responseStatus,
        reason: "healthy",
        message: `ลิงก์สามารถเข้าถึงได้ปกติ (HTTP ${responseStatus} OK)`,
        tested_url: testUrl,
      });
    }

    if (responseStatus === 401 || responseStatus === 403) {
      return res.json({
        is_healthy: false,
        status_code: responseStatus,
        reason: "restricted",
        message: "ลิงก์ถูกจำกัดสิทธิ์หรือยังไม่ได้เปิดแชร์เป็นสาธารณะ (HTTP 403 Forbidden / Private)",
        tested_url: testUrl,
      });
    }

    if (responseStatus === 404 || responseStatus === 410) {
      return res.json({
        is_healthy: false,
        status_code: responseStatus,
        reason: "not_found",
        message: "ไม่พบหน้าหรือไฟล์ปลายทาง (HTTP 404 Not Found) ลิงก์อาจถูกลบหรือย้ายโฟลเดอร์",
        tested_url: testUrl,
      });
    }

    return res.json({
      is_healthy: false,
      status_code: responseStatus,
      reason: "error_status",
      message: `เซิร์ฟเวอร์ปลายทางตอบกลับด้วยรหัสข้อผิดพลาด (HTTP ${responseStatus})`,
      tested_url: testUrl,
    });
  } catch (err) {
    return res.json({
      is_healthy: false,
      status_code: null,
      reason: "invalid_url",
      message: "รูปแบบ URL ไม่ถูกต้องหรือไม่สามารถประมวลผลได้",
      tested_url: testUrl,
    });
  }
};