import { Router } from "express";
import {
  createComment,
  getCommentsByAssignment,
  updateComment,
  deleteComment,
} from "../controllers/comment.controller";
import { authMiddleware } from "../middlewares/auth.middlewares";

const router = Router();

router.post("/create", authMiddleware, createComment);
router.get("/:assignment_id", authMiddleware, getCommentsByAssignment);
router.put("/update/:comment_id",authMiddleware, updateComment);
router.delete("/delete/:comment_id",authMiddleware, deleteComment);

export default router;