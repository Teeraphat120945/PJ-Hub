import { Request, Response } from "express";
import { db } from "../db";

export const createComment = async (req: Request, res: Response) => {
  try {
    const { assignment_id, user_id, comment_text } = req.body;
    const conn = await db.getConnection();
    if (!assignment_id || !comment_text) {
      return res.status(400).json({
        message: "ข้อมูลไม่ครบ",
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
      [assignment_id, user_id, comment_text],
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
    console.error(error);

    return res.status(500).json({
      message: "server error",
    });
  }
};

export const getCommentsByAssignment = async (req: Request, res: Response) => {
  try {
    const assignment_id = req.params.assignment_id;
    const conn = await db.getConnection();
    const [rows] = await conn.execute(
      `
      SELECT ac.comment_id, ac.assignment_id, ac.user_id,us.user_name , 
      ac.comment_text, ac.created_datetime  FROM assignment_comments AS ac
      LEFT OUTER JOIN users AS us ON us.user_id = ac.user_id
      WHERE ac.assignment_id = ?
      AND ac.deleted_flg = 0
      ORDER BY ac.created_datetime DESC
      `,
      [assignment_id],
    );

    return res.status(200).json(rows);
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      message: "server error",
    });
  }
};

export const updateComment = async (req: Request, res: Response) => {
  try {
    const { comment_id } = req.params;

    const { comment_text } = req.body;

    await db.query(
      `
      UPDATE assignment_comments
      SET
        comment_text = ?,
        updated_datetime = NOW()
      WHERE comment_id = ?
      `,
      [comment_text, comment_id],
    );

    res.json({
      success: true,
      message: "อัปเดตสำเร็จ",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "อัปเดตไม่สำเร็จ",
    });
  }
};

export const deleteComment = async (req: Request, res: Response) => {
  try {
    const { comment_id } = req.params;

    await db.query(
      `
      DELETE FROM assignment_comments
      WHERE comment_id = ?
      `,
      [comment_id],
    );

    res.json({
      success: true,
      message: "ลบสำเร็จ",
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "ลบไม่สำเร็จ",
    });
  }
};