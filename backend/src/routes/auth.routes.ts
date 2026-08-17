import { Router } from "express";
import {
  login,
  register,
  getProfile,
  getGoogleAuthUrl,
  googleCallback,
  getMicrosoftAuthUrl,
  microsoftCallback,
  demoSocialLogin,
} from "../controllers/auth.controller";
import { authMiddleware } from "../middlewares/auth.middlewares";

const router = Router();

router.post("/login", login);
router.post("/register", register);
router.get("/profile", authMiddleware, getProfile);

router.get("/google/url", getGoogleAuthUrl);
router.get("/google/callback", googleCallback);
router.get("/microsoft/url", getMicrosoftAuthUrl);
router.get("/microsoft/callback", microsoftCallback);
router.post("/demo-social-login", demoSocialLogin);

export default router;


