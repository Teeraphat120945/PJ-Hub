import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db";

const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3000";
const JWT_SECRET = process.env.JWT_SECRET || "classroom_jwt_secret_key_2026";

export const linkOrCreateOAuthUser = async (profile: {
  provider: "google" | "microsoft";
  providerId: string;
  email: string;
  name?: string;
  avatarUrl?: string;
}) => {
  const conn = await db.getConnection();
  try {
    const email = (profile.email || "").trim().toLowerCase();
    const providerColumn = profile.provider === "google" ? "google_id" : "microsoft_id";

    const [rowsByProvider]: any = await conn.query(
      `SELECT * FROM users WHERE ${providerColumn} = ? AND deleted_flg = 0`,
      [profile.providerId]
    );

    if (rowsByProvider.length > 0) {
      const user = rowsByProvider[0];
      await conn.query("UPDATE users SET last_login = NOW() WHERE user_id = ?", [user.user_id]);

      const token = jwt.sign(
        {
          user_id: user.user_id,
          user_name: user.user_name,
          email: user.email,
          role: user.role_flg,
        },
        JWT_SECRET,
        { expiresIn: "1h" }
      );

      return { user, token, isNew: false, isLinked: false };
    }

    if (email) {
      const [rowsByEmail]: any = await conn.query(
        `SELECT * FROM users WHERE LOWER(email) = LOWER(?) AND deleted_flg = 0`,
        [email]
      );

      if (rowsByEmail.length > 0) {
        const user = rowsByEmail[0];

        await conn.query(
          `UPDATE users 
           SET ${providerColumn} = ?,
               avatar_url = COALESCE(avatar_url, ?),
               last_login = NOW() 
           WHERE user_id = ?`,
          [profile.providerId, profile.avatarUrl || null, user.user_id]
        );

        const token = jwt.sign(
          {
            user_id: user.user_id,
            user_name: user.user_name,
            email: user.email,
            role: user.role_flg,
          },
          JWT_SECRET,
          { expiresIn: "1h" }
        );

        return { user, token, isNew: false, isLinked: true };
      }
    }

    const [seqRows]: any = await conn.query(
      "SELECT prefix, current_value FROM ref_number WHERE name = 'user' FOR UPDATE"
    );
    const prefix = seqRows?.[0]?.prefix || "US";
    const currentValue = seqRows?.[0]?.current_value || 0;
    const nextValue = currentValue + 1;
    const userCode = `${prefix}${String(nextValue).padStart(3, "0")}`;

    await conn.query(
      "UPDATE ref_number SET current_value = ? WHERE name = 'user'",
      [nextValue]
    );

    const displayName = profile.name?.trim() || (email ? email.split("@")[0] : `User_${userCode}`);

    await conn.query(
      `INSERT INTO users 
       (user_id, user_name, email, ${providerColumn}, avatar_url, role_flg, deleted_flg, last_login) 
       VALUES (?, ?, ?, ?, ?, 3, 0, NOW())`,
      [userCode, displayName, email || null, profile.providerId, profile.avatarUrl || null]
    );

    const newUser = {
      user_id: userCode,
      user_name: displayName,
      email: email || null,
      role_flg: 3,
    };

    const token = jwt.sign(
      {
        user_id: userCode,
        user_name: displayName,
        email: email || null,
        role: 3,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return { user: newUser, token, isNew: true, isLinked: false };
  } finally {
    conn.release();
  }
};

export const register = async (req: Request, res: Response) => {
  const { username, email, password } = req.body;

  if (!username?.trim() || !password?.trim()) {
    return res.status(400).json({ message: "กรุณาระบุชื่อผู้ใช้และรหัสผ่าน" });
  }

  const cleanUsername = username.trim();
  const cleanEmail = (email || "").trim().toLowerCase();
  const cleanPassword = password.trim();

  const conn = await db.getConnection();
  try {
    const [existsUsername]: any = await conn.query(
      "SELECT user_id FROM users WHERE user_name = ? AND deleted_flg = 0",
      [cleanUsername]
    );

    if (existsUsername.length > 0) {
      return res.status(400).json({ message: "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว!" });
    }

    if (cleanEmail) {
      const [existsEmail]: any = await conn.query(
        "SELECT user_id, user_password, user_name FROM users WHERE LOWER(email) = LOWER(?) AND deleted_flg = 0",
        [cleanEmail]
      );

      if (existsEmail.length > 0) {
        const existingUser = existsEmail[0];

        if (!existingUser.user_password) {
          const hashed = await bcrypt.hash(cleanPassword, 10);
          await conn.query(
            "UPDATE users SET user_password = ?, user_name = ? WHERE user_id = ?",
            [hashed, cleanUsername, existingUser.user_id]
          );

          const token = jwt.sign(
            {
              user_id: existingUser.user_id,
              user_name: cleanUsername,
              email: cleanEmail,
              role: 3,
            },
            JWT_SECRET,
            { expiresIn: "1h" }
          );

          return res.status(200).json({
            token,
            message: "ผูกรหัสผ่านเข้ากับบัญชีเดิมของคุณเรียบร้อยแล้ว",
          });
        }

        return res.status(400).json({ message: "อีเมลนี้มีบัญชีในระบบแล้ว กรุณาเข้าสู่ระบบ" });
      }
    }

    const [seqRows]: any = await conn.query(
      "SELECT prefix, current_value FROM ref_number WHERE name = 'user' FOR UPDATE"
    );
    const prefix = seqRows?.[0]?.prefix || "US";
    const currentValue = seqRows?.[0]?.current_value || 0;
    const nextValue = currentValue + 1;
    const userCode = `${prefix}${String(nextValue).padStart(3, "0")}`;

    const hashed = await bcrypt.hash(cleanPassword, 10);

    await conn.query(
      "UPDATE ref_number SET current_value = ? WHERE name = 'user'",
      [nextValue]
    );

    await conn.query(
      "INSERT INTO users (user_id, user_name, email, user_password, role_flg, deleted_flg, last_login) VALUES (?, ?, ?, ?, 3, 0, NOW())",
      [userCode, cleanUsername, cleanEmail || null, hashed]
    );

    const token = jwt.sign(
      {
        user_id: userCode,
        user_name: cleanUsername,
        email: cleanEmail || null,
        role: 3,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(201).json({ token, message: "สมัครสมาชิกสำเร็จ" });
  } catch (err) {
    console.error("register error:", err);
    res.status(500).json({ message: "server error" });
  } finally {
    conn.release();
  }
};

export const login = async (req: Request, res: Response) => {
  const { identifier, username, password } = req.body;
  const loginKey = (identifier || username || "").trim();

  if (!loginKey || !password?.trim()) {
    return res.status(400).json({ message: "กรุณาระบุอีเมล/ชื่อผู้ใช้ และรหัสผ่าน" });
  }

  const conn = await db.getConnection();
  try {
    const [rows]: any = await conn.query(
      `
      SELECT user_id, user_name, email, user_password, role_flg
      FROM users
      WHERE (user_name = ? OR LOWER(email) = LOWER(?)) AND deleted_flg = 0
      `,
      [loginKey, loginKey]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: "อีเมล/ชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง" });
    }

    const user = rows[0];

    if (!user.user_password) {
      return res.status(400).json({
        message: "บัญชีนี้เข้าใช้งานผ่าน Social Login (Google / Microsoft) กรุณาเข้าสู่ระบบด้วยปุ่มด้านล่าง",
      });
    }

    const isMatch = await bcrypt.compare(password.trim(), user.user_password);
    if (!isMatch) {
      return res.status(401).json({ message: "อีเมล/ชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง" });
    }

    await conn.query("UPDATE users SET last_login = NOW() WHERE user_id = ?", [user.user_id]);

    const token = jwt.sign(
      {
        user_id: user.user_id,
        user_name: user.user_name,
        email: user.email,
        role: user.role_flg,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return res.json({
      returnData: {
        user_id: user.user_id,
        user_name: user.user_name,
        email: user.email,
        role: user.role_flg,
      },
      token,
    });
  } catch (err) {
    console.error("login error:", err);
    return res.status(500).json({ message: "Server error" });
  } finally {
    conn.release();
  }
};

export const getGoogleAuthUrl = (_req: Request, res: Response) => {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = `${BACKEND_URL}/api/auth/google/callback`;

  if (!clientId) {
    return res.status(200).json({
      url: `${FRONTEND_URL}/login?oauth_demo=google`,
      isConfigured: false,
      message: "Google OAuth Client ID ยังไม่ได้ตั้งค่าใน .env (สามารถใช้โหมด Demo จำลองได้)",
    });
  }

  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=openid%20email%20profile&access_type=offline&prompt=consent`;

  return res.json({ url, isConfigured: true });
};

export const googleCallback = async (req: Request, res: Response) => {
  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect(`${FRONTEND_URL}/login?error=google_auth_failed`);
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${BACKEND_URL}/api/auth/google/callback`;

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: String(code),
        client_id: clientId || "",
        client_secret: clientSecret || "",
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || "Google token exchange failed");
    }

    const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await profileRes.json();
    const result = await linkOrCreateOAuthUser({
      provider: "google",
      providerId: profile.id,
      email: profile.email,
      name: profile.name,
      avatarUrl: profile.picture,
    });

    const redirectUrl = `${FRONTEND_URL}/login?oauth=success&token=${result.token}&user_id=${
      result.user.user_id
    }&user_name=${encodeURIComponent(result.user.user_name)}&role=${result.user.role_flg}&email=${encodeURIComponent(
      result.user.email || ""
    )}&provider=Google`;

    return res.redirect(redirectUrl);
  } catch (err) {
    console.error("googleCallback error:", err);
    return res.redirect(`${FRONTEND_URL}/login?error=google_exchange_failed`);
  }
};

export const getMicrosoftAuthUrl = (_req: Request, res: Response) => {
  const clientId = process.env.MICROSOFT_CLIENT_ID;
  const redirectUri = `${BACKEND_URL}/api/auth/microsoft/callback`;

  if (!clientId) {
    return res.status(200).json({
      url: `${FRONTEND_URL}/login?oauth_demo=microsoft`,
      isConfigured: false,
      message: "Microsoft OAuth Client ID ยังไม่ได้ตั้งค่าใน .env (สามารถใช้โหมด Demo จำลองได้)",
    });
  }

  const url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientId}&response_type=code&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_mode=query&scope=openid%20email%20profile%20User.Read`;

  return res.json({ url, isConfigured: true });
};

export const microsoftCallback = async (req: Request, res: Response) => {
  const { code, error } = req.query;

  if (error || !code) {
    return res.redirect(`${FRONTEND_URL}/login?error=microsoft_auth_failed`);
  }

  try {
    const clientId = process.env.MICROSOFT_CLIENT_ID;
    const clientSecret = process.env.MICROSOFT_CLIENT_SECRET;
    const redirectUri = `${BACKEND_URL}/api/auth/microsoft/callback`;

    const tokenRes = await fetch("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId || "",
        client_secret: clientSecret || "",
        code: String(code),
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(tokenData.error_description || "Microsoft token exchange failed");
    }

    const profileRes = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    const profile = await profileRes.json();
    const email = profile.mail || profile.userPrincipalName;
    const result = await linkOrCreateOAuthUser({
      provider: "microsoft",
      providerId: profile.id,
      email: email,
      name: profile.displayName,
    });

    const redirectUrl = `${FRONTEND_URL}/login?oauth=success&token=${result.token}&user_id=${
      result.user.user_id
    }&user_name=${encodeURIComponent(result.user.user_name)}&role=${result.user.role_flg}&email=${encodeURIComponent(
      result.user.email || ""
    )}&provider=Microsoft`;

    return res.redirect(redirectUrl);
  } catch (err) {
    console.error("microsoftCallback error:", err);
    return res.redirect(`${FRONTEND_URL}/login?error=microsoft_exchange_failed`);
  }
};

export const demoSocialLogin = async (req: Request, res: Response) => {
  const { provider, email, name } = req.body;

  if (!email || !provider) {
    return res.status(400).json({ message: "กรุณาระบุ provider และ email" });
  }

  const cleanProvider = provider === "microsoft" ? "microsoft" : "google";
  const cleanEmail = String(email).trim().toLowerCase();
  const providerId = `demo_${cleanProvider}_${Buffer.from(cleanEmail).toString("hex").slice(0, 16)}`;

  try {
    const result = await linkOrCreateOAuthUser({
      provider: cleanProvider,
      providerId,
      email: cleanEmail,
      name: name || cleanEmail.split("@")[0],
    });

    return res.json({
      message: result.isLinked
        ? `เข้าสู่ระบบและผูกบัญชี ${cleanProvider} เข้ากับบัญชีเดิม (${cleanEmail}) สำเร็จ`
        : `เข้าสู่ระบบด้วย ${cleanProvider} สำเร็จ`,
      token: result.token,
      returnData: {
        user_id: result.user.user_id,
        user_name: result.user.user_name,
        email: result.user.email,
        role: result.user.role_flg,
      },
    });
  } catch (err) {
    console.error("demoSocialLogin error:", err);
    return res.status(500).json({ message: "Social login error" });
  }
};

export const getProfile = (req: any, res: Response) => {
  res.json({
    user_id: req.user?.user_id || req.user?.id,
    user_name: req.user?.user_name || req.user?.username,
    email: req.user?.email,
    role: req.user?.role,
  });
};





