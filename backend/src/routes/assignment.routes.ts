import { Router } from "express";
import { createAssignment, downloadAssignmentFile, getAssignment, getAssignmentDetail ,getAssignmentByUser, updateAssignment, deleteAssignment} from "../controllers/assignment.controller";
import { authMiddleware } from "../middlewares/auth.middlewares";
import { upload } from "../middlewares/upload.middlewares"
 
const router = Router();

router.post("/create",authMiddleware, upload.array("files", 10), createAssignment);
router.put("/update/:assignmentId",authMiddleware,upload.array("files"),updateAssignment);
router.delete("/delete/:assignmentId", authMiddleware, deleteAssignment);

router.get("/get-assignment-by-user",authMiddleware,getAssignmentByUser);
router.get("/get-assignment/:classId", getAssignment);
router.get("/get-detail/:assignment_id", authMiddleware, getAssignmentDetail);

router.get("/assignment/file/:fileId", authMiddleware, downloadAssignmentFile);
router.post

export default router;
