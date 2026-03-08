import { Router } from "express";
import * as ctrl  from "../controllers/classUser.controller";
import { authMiddleware } from "../middlewares/auth.middlewares";

const router = Router();

router.get("/classes", authMiddleware, ctrl.getClasses);

router.get("/:classId/users", authMiddleware, ctrl.getClassUsers);
router.post("/:classId/users", authMiddleware, ctrl.addClassUser);
router.delete("/:classId/users/:userId", authMiddleware, ctrl.removeUser);

export default router;
