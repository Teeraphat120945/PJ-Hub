import { Request, Response } from "express";
import { db } from "../db";

export const createComment = async (req: Request, res: Response) => {
  const conn = await db.getConnection();
  try {
    const { assignment_id, comment_text } = req.body;
    const userId = (req as any).user?.user_id || (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!assignment_id || !comment_text || !comment_text.trim()) {
      return res.status(400).json({
        message: "ข้อมูลไม่ครบ",
      });
    }

    const [assignmentRows]: any = await conn.query(
      `
      SELECT a.assignment_id, a.created_by AS assignment_owner, a.class_id, c.created_by AS class_owner
      FROM class_assignments a
      LEFT JOIN classes c ON c.class_id = a.class_id
      WHERE a.assignment_id = ? AND a.deleted_flg = 0
      `,
      [assignment_id]
    );

    if (assignmentRows.length === 0) {
      return res.status(404).json({ message: "ไม่พบผลงาน" });
    }

    const assignment = assignmentRows[0];
    const isWorkOwner = String(assignment.assignment_owner) === String(userId);
    const isClassOwner = String(assignment.class_owner) === String(userId);
    const isAdmin = Number(userRole) === 0;

    let isEnrolledInstructor = false;
    if (!isWorkOwner && !isClassOwner && !isAdmin) {
      const [instructorRows]: any = await conn.query(
        `
        SELECT 1 FROM class_users cu
        INNER JOIN users u ON u.user_id = cu.user_id
        WHERE cu.class_id = ? AND cu.user_id = ? AND cu.deleted_flg = 0 AND u.role_flg = 1
        `,
        [assignment.class_id, userId]
      );
      isEnrolledInstructor = instructorRows.length > 0;
    }

    if (!isWorkOwner && !isClassOwner && !isAdmin && !isEnrolledInstructor) {
      return res.status(403).json({
        message: "การแสดงความคิดเห็นสงวนสิทธิ์เฉพาะผู้สอนประจำวิชาและเจ้าของผลงานเท่านั้น",
      });
    }

    const [result]: any = await conn.execute(
      `
      INSERT INTO assignment_comments
      (
        assignment_id,
        user_id,
        comment_text
      )
      VALUES (?, ?, ?)
      `,
      [assignment_id, userId, comment_text.trim()],
    );

    const [rows]: any = await conn.execute(
      `
      SELECT ac.comment_id, ac.assignment_id, ac.user_id,
      us.user_name, ac.comment_text, ac.created_datetime
      FROM assignment_comments ac
      LEFT JOIN users us
      ON us.user_id = ac.user_id
      WHERE ac.comment_id = ?
      `,
      [result.insertId],
    );

    return res.status(201).json(rows[0]);
  } catch (error) {
    console.error("createComment error:", error);
    return res.status(500).json({
      message: "server error",
    });
  } finally {
    conn.release();
  }
};

export const getCommentsByAssignment = async (req: Request, res: Response) => {
  const conn = await db.getConnection();
  try {
    const assignment_id = req.params.assignment_id;
    const [rows] = await conn.execute(
      `
      SELECT ac.comment_id, ac.assignment_id, ac.user_id, us.user_name, 
      ac.comment_text, ac.created_datetime
      FROM assignment_comments AS ac
      LEFT OUTER JOIN users AS us ON us.user_id = ac.user_id
      WHERE ac.assignment_id = ?
      AND ac.deleted_flg = 0
      ORDER BY ac.created_datetime DESC
      `,
      [assignment_id],
    );

    return res.status(200).json(rows);
  } catch (error) {
    console.error("getCommentsByAssignment error:", error);
    return res.status(500).json({
      message: "server error",
    });
  } finally {
    conn.release();
  }
};

export const updateComment = async (req: Request, res: Response) => {
  try {
    const { comment_id } = req.params;
    const { comment_text } = req.body;
    const userId = (req as any).user?.user_id || (req as any).user?.id;
    const userRole = (req as any).user?.role;

    if (!comment_text || !comment_text.trim()) {
      return res.status(400).json({ message: "กรุณาระบุข้อความความคิดเห็น" });
    }

    const [commentRows]: any = await db.query(
      `SELECT * FROM assignment_comments WHERE comment_id = ? AND deleted_flg = 0`,
      [comment_id]
    );

    if (commentRows.length === 0) {
      return res.status(404).json({ message: "ไม่พบความคิดเห็น" });
    }

    const comment = commentRows[0];
    if (String(comment.user_id) !== String(userId) && Number(userRole) !== 0) {
      return res.status(403).json({ message: "คุณไม่มีสิทธิ์แก้ไขความคิดเห็นนี้" });
    }

    await db.query(
      `
      UPDATE assignment_comments
      SET
        comment_text = ?,
        updated_datetime = NOW()
      WHERE comment_id = ?
      `,
      [comment_text.trim(), comment_id],
    );

    res.json({
      success: true,
      message: "อัปเดตสำเร็จ",
    });
  } catch (error) {
    console.error("updateComment error:", error);
    res.status(500).json({
      success: false,
      message: "อัปเดตไม่สำเร็จ",
    });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { comment_id } = req.params;
    const userId = (req as any).user?.user_id || (req as any).user?.id;
    const userRole = (req as any).user?.role;

    const [rows]: any = await db.query(
      `
      SELECT ac.user_id AS comment_author, a.created_by AS assignment_owner, c.created_by AS class_owner
      FROM assignment_comments ac
      INNER JOIN class_assignments a ON a.assignment_id = ac.assignment_id
      LEFT JOIN classes c ON c.class_id = a.class_id
      WHERE ac.comment_id = ? AND ac.deleted_flg = 0
      `,
      [comment_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "ไม่พบความคิดเห็น" });
    }

    const target = rows[0];
    const isAuthor = String(target.comment_author) === String(userId);
    const isClassOwner = String(target.class_owner) === String(userId);
    const isAdmin = Number(userRole) === 0;

    if (!isAuthor && !isClassOwner && !isAdmin) {
      return res.status(403).json({ message: "คุณไม่มีสิทธิ์ลบความคิดเห็นนี้" });
    }

    await db.query(
      `
      UPDATE assignment_comments
      SET deleted_flg = 1
      WHERE comment_id = ?
      `,
      [comment_id],
    );

    res.json({
      success: true,
      message: "ลบสำเร็จ",
    });
  } catch (error) {
    console.error("deleteComment error:", error);
    res.status(500).json({
      success: false,
      message: "ลบไม่สำเร็จ",
    });
  }
};