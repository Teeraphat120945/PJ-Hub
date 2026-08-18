import { Router } from "express";
import * as ctrl from "../controllers/classUser.controller";
import { authMiddleware, authorizeRoles } from "../middlewares/auth.middlewares";

const router = Router();

router.get("/classes", authMiddleware, ctrl.getClasses);

router.get("/:classId/users", authMiddleware, ctrl.getClassUsers);
router.post("/:classId/users", authMiddleware, authorizeRoles(0, 1), ctrl.addClassUser);
router.delete("/:classId/users/:userId", authMiddleware, authorizeRoles(0, 1), ctrl.removeUser);

export default router;

