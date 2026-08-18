import { Router } from "express";
import {
  getUsers,
  updateUserRole,
  updateUserActive,
  getAvaliableUsers,
  getRoles,
} from "../controllers/user.controller";
import { authMiddleware, authorizeRoles } from "../middlewares/auth.middlewares";

const router = Router();

router.get("/getUsers", authMiddleware, authorizeRoles(0, 1), getUsers);
router.patch("/users/:user_id/role", authMiddleware, authorizeRoles(0, 1), updateUserRole);
router.patch("/users/:user_id/active", authMiddleware, authorizeRoles(0), updateUserActive);
router.get("/users/:classId/available-users", authMiddleware, authorizeRoles(0, 1), getAvaliableUsers);
router.get("/get-role", authMiddleware, getRoles);

export default router;

