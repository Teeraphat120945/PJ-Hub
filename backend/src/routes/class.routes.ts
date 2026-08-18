import { Router } from "express";
import {
  create,
  view,
  getClassesByCondition,
  updateClass,
  getClassesByUser,
  getClassesByTeacher,
  deletedClass,
} from "../controllers/class.controller";
import { authMiddleware, authorizeRoles } from "../middlewares/auth.middlewares";

const router = Router();

router.post("/create", authMiddleware, authorizeRoles(0, 1), create);
router.get("/view", view);

router.get("/getclass/by-teacher", authMiddleware, authorizeRoles(0, 1), getClassesByTeacher);
router.get("/getclass/by-user", authMiddleware, getClassesByUser);
router.get("/getclass/:classId", getClassesByCondition);

router.put("/update/:classId", authMiddleware, authorizeRoles(0, 1), updateClass);
router.delete("/delete/:classId", authMiddleware, authorizeRoles(0, 1), deletedClass);

export default router;

