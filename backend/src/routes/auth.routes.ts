import { Router } from "express";

import {
  login,
  register,
  getProfile,
  getGoogleOAuthUrl,
  googleCallback,
  getMicrosoftAuthUrl,
  microsoftCallback,
  demoSocialLogin,
  updateEmail,
  requestPasswordReset,
  verifyResetOtp,
  resetPassword,
  changePassword,
} from "../controllers/auth.controller";

import {
  authMiddleware,
} from "../middlewares/auth.middlewares";

const router = Router();

/* ===============================
   Custom Login
================================ */

router.post(
  "/login",
  login
);

router.post(
  "/register",
  register
);

router.get(
  "/profile",
  authMiddleware,
  getProfile
);

router.put(
  "/email",
  authMiddleware,
  updateEmail
);


router.get(
  "/oauth/google",
  getGoogleOAuthUrl
);

router.get(
  "/google/callback",
  googleCallback
);
router.get(
  "/microsoft/url",
  getMicrosoftAuthUrl
);

router.get(
  "/microsoft/callback",
  microsoftCallback
);

router.post(
  "/demo-social-login",
  demoSocialLogin
);

/* ===============================
   Password Reset & Change
================================ */

router.post(
  "/forgot-password/request",
  requestPasswordReset
);

router.post(
  "/forgot-password/verify-otp",
  verifyResetOtp
);

router.post(
  "/forgot-password/reset",
  resetPassword
);

router.post(
  "/change-password",
  changePassword
);

export default router;
