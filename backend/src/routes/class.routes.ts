import { Router } from "express";
import { create, view, getClassesByCondition, updateClass, getClassesByUser, getClassesByTeacher, deletedClass } from "../controllers/class.controller";
import { authMiddleware } from "../middlewares/auth.middlewares";

const router = Router();

router.post("/create", authMiddleware, create);
router.get("/view", view);

router.get("/getclass/by-teacher", authMiddleware, getClassesByTeacher);
router.get("/getclass/by-user", authMiddleware, getClassesByUser);
router.get("/getclass/:classId", getClassesByCondition);

router.put("/update/:classId", authMiddleware, updateClass);

router.delete("/deleted/:classId", authMiddleware, deletedClass)
export default router;
