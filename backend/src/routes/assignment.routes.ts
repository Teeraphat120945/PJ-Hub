import { Router } from "express";
import {
  createAssignment,
  downloadAssignmentFile,
  getAssignment,
  getAssignmentDetail,
  getAssignmentByUser,
  updateAssignment,
  deleteAssignment,
  searchAssignments,
  checkAssignmentLink,
} from "../controllers/assignment.controller";
import { authMiddleware, authorizeRoles } from "../middlewares/auth.middlewares";
import { upload } from "../middlewares/upload.middlewares";

const router = Router();

router.get("/search", searchAssignments);
router.post("/create", authMiddleware, authorizeRoles(0, 1, 2), upload.array("files", 10), createAssignment);
router.put("/update/:assignmentId", authMiddleware, authorizeRoles(0, 1, 2), upload.array("files"), updateAssignment);
router.delete("/delete/:assignmentId", authMiddleware, authorizeRoles(0, 1, 2), deleteAssignment);

router.get("/get-assignment-by-user", authMiddleware, authorizeRoles(0, 1, 2), getAssignmentByUser);
router.get("/get-assignment/:classId", getAssignment);
router.get("/get-detail/:assignment_id", authMiddleware, getAssignmentDetail);

router.get("/file/:fileId", authMiddleware, downloadAssignmentFile);
router.post("/check-link", authMiddleware, checkAssignmentLink);

export default router;

