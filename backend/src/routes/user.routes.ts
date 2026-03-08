import { Router } from "express";
import { getUsers, updateUserRole, updateUserActive, getAvaliableUsers, getRoles } from "../controllers/user.controller";
import { authMiddleware } from "../middlewares/auth.middlewares";

const router = Router();

router.get("/getUsers", authMiddleware, getUsers);
router.patch("/users/:user_id/role", authMiddleware, updateUserRole);
router.patch("/users/:user_id/active", authMiddleware, updateUserActive);
router.get("/users/:classId/available-users", authMiddleware, getAvaliableUsers);
router.get("/get-role",authMiddleware, getRoles);
export default router;
