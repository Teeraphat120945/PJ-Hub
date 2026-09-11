import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { RowDataPacket } from "mysql2";
import { db } from "../db";

const FRONTEND_URL =
  (process.env.FRONTEND_URL || "http://localhost:5173").replace(/\/+$/, "");

const BACKEND_URL =
  (process.env.BACKEND_URL || "http://localhost:3000").replace(/\/+$/, "");

type OAuthProvider = "google" | "microsoft";

interface UserRow extends RowDataPacket {
  user_id: string;
  user_name: string;
  email: string | null;
  user_password: string | null;
  role_flg: number;
}

interface RefNumberRow extends RowDataPacket {
  prefix: string;
  current_value: number;
}

interface GoogleTokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface GoogleProfile {
  id?: string;
  email?: string;
  verified_email?: boolean;
  name?: string;
  picture?: string;
}

interface MicrosoftTokenResponse {
  access_token?: string;
  token_type?: string;
  expires_in?: number;
  error?: string;
  error_description?: string;
}

interface MicrosoftProfile {
  id?: string;
  displayName?: string;
  mail?: string | null;
  userPrincipalName?: string;
}

const getJwtSecret = (): string => {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured in .env");
  }

  return secret;
};

const createUserToken = (user: {
  user_id: string;
  user_name: string;
  email: string | null;
  role_flg: number;
}) => {
  return jwt.sign(
    {
      user_id: user.user_id,
      user_name: user.user_name,
      email: user.email,
      role: user.role_flg,
    },
    getJwtSecret(),
    {
      expiresIn: "1h",
    }
  );
};

export const linkOrCreateOAuthUser = async (profile: {
  provider: OAuthProvider;
  providerId: string;
  email: string;
  name?: string;
}) => {
  const conn = await db.getConnection();

  try {
    const email = profile.email.trim().toLowerCase();

    if (!email) {
      throw new Error("OAuth provider ไม่ได้ส่ง email กลับมา");
    }

    /* -----------------------------------------------------
       1. เช็กว่า provider account นี้เคย link แล้วหรือยัง
    ----------------------------------------------------- */

    const [providerUsers] = await conn.query<UserRow[]>(
      `
        SELECT
          u.user_id,
          u.user_name,
          u.email,
          u.user_password,
          u.role_flg
        FROM user_auth_providers uap
        INNER JOIN users u
          ON u.user_id = uap.user_id
        WHERE uap.provider = ?
          AND uap.provider_user_id = ?
          AND u.deleted_flg = 0
        LIMIT 1
      `,
      [profile.provider, profile.providerId]
    );

    if (providerUsers.length > 0) {
      const user = providerUsers[0];

      await conn.query(
        `
          UPDATE users
          SET last_login = NOW()
          WHERE user_id = ?
        `,
        [user.user_id]
      );

      const token = createUserToken(user);

      return {
        user,
        token,
        isNew: false,
        isLinked: false,
      };
    }

    /* -----------------------------------------------------
       2. provider ยังไม่เคย link
          เช็กว่ามี user ที่ใช้ email เดียวกันหรือไม่
    ----------------------------------------------------- */

    const [emailUsers] = await conn.query<UserRow[]>(
      `
        SELECT
          user_id,
          user_name,
          email,
          user_password,
          role_flg
        FROM users
        WHERE LOWER(email) = LOWER(?)
          AND deleted_flg = 0
        LIMIT 1
      `,
      [email]
    );

    /*
      ถ้ามี account เดิมที่ email ตรงกัน
      link OAuth provider เข้ากับ user เดิม
    */

    if (emailUsers.length > 0) {
      const user = emailUsers[0];

      await conn.beginTransaction();

      try {
        await conn.query(
          `
            INSERT INTO user_auth_providers
            (
              user_id,
              provider,
              provider_user_id,
              provider_email
            )
            VALUES (?, ?, ?, ?)
          `,
          [
            user.user_id,
            profile.provider,
            profile.providerId,
            email,
          ]
        );

        await conn.query(
          `
            UPDATE users
            SET last_login = NOW()
            WHERE user_id = ?
          `,
          [user.user_id]
        );

        await conn.commit();
      } catch (error) {
        await conn.rollback();
        throw error;
      }

      const token = createUserToken(user);

      return {
        user,
        token,
        isNew: false,
        isLinked: true,
      };
    }

    /* -----------------------------------------------------
       3. ไม่มี user เลย
          สร้าง user ใหม่ + provider
    ----------------------------------------------------- */

    await conn.beginTransaction();

    try {
      const [seqRows] = await conn.query<RefNumberRow[]>(
        `
          SELECT prefix, current_value
          FROM ref_number
          WHERE name = 'user'
          FOR UPDATE
        `
      );

      if (seqRows.length === 0) {
        throw new Error(
          "ไม่พบ sequence 'user' ใน ref_number"
        );
      }

      const prefix = seqRows[0].prefix || "US";
      const currentValue = seqRows[0].current_value || 0;

      const nextValue = currentValue + 1;

      const userCode =
        `${prefix}${String(nextValue).padStart(3, "0")}`;

      let displayName =
        profile.name?.trim() ||
        email.split("@")[0] ||
        `User_${userCode}`;

      // user_name ของ DB เดิมมี VARCHAR(50)
      displayName = displayName.slice(0, 50);

      // ป้องกันชื่อซ้ำ
      const [sameName] = await conn.query<RowDataPacket[]>(
        `
          SELECT user_id
          FROM users
          WHERE user_name = ?
          LIMIT 1
        `,
        [displayName]
      );

      if (sameName.length > 0) {
        const suffix = `_${userCode}`;

        displayName =
          `${displayName.slice(0, 50 - suffix.length)}${suffix}`;
      }

      await conn.query(
        `
          UPDATE ref_number
          SET current_value = ?
          WHERE name = 'user'
        `,
        [nextValue]
      );

      /*
        OAuth account ไม่จำเป็นต้องมี password
        เพราะฉะนั้น user_password = NULL
      */

      await conn.query(
        `
          INSERT INTO users
          (
            user_id,
            user_name,
            email,
            user_password,
            role_flg,
            deleted_flg,
            last_login
          )
          VALUES (?, ?, ?, NULL, 3, 0, NOW())
        `,
        [
          userCode,
          displayName,
          email,
        ]
      );

      /*
        เก็บ Google / Microsoft identity
        ใน user_auth_providers
      */

      await conn.query(
        `
          INSERT INTO user_auth_providers
          (
            user_id,
            provider,
            provider_user_id,
            provider_email
          )
          VALUES (?, ?, ?, ?)
        `,
        [
          userCode,
          profile.provider,
          profile.providerId,
          email,
        ]
      );

      await conn.commit();

      const newUser = {
        user_id: userCode,
        user_name: displayName,
        email,
        role_flg: 3,
      };

      const token = createUserToken(newUser);

      return {
        user: newUser,
        token,
        isNew: true,
        isLinked: false,
      };
    } catch (error) {
      await conn.rollback();
      throw error;
    }
  } finally {
    conn.release();
  }
};

/* =========================================================
   REGISTER
========================================================= */

export const register = async (
  req: Request,
  res: Response
) => {
  const { username, email, password } = req.body;

  if (
    typeof username !== "string" ||
    typeof email !== "string" ||
    typeof password !== "string" ||
    !username.trim() ||
    !email.trim() ||
    !password
  ) {
    return res.status(400).json({
      message:
        "กรุณาระบุชื่อผู้ใช้ อีเมล และรหัสผ่าน",
    });
  }

  const cleanUsername = username.trim();

  const cleanEmail =
    email.trim().toLowerCase();

  /*
    password ไม่ trim
    เพราะ space อาจเป็นส่วนหนึ่งของ password
  */
  const cleanPassword = password;

  const conn = await db.getConnection();

  try {
    const [existsUsername] =
      await conn.query<RowDataPacket[]>(
        `
          SELECT user_id
          FROM users
          WHERE user_name = ?
            AND deleted_flg = 0
          LIMIT 1
        `,
        [cleanUsername]
      );

    if (existsUsername.length > 0) {
      return res.status(400).json({
        message: "ชื่อผู้ใช้นี้ถูกใช้งานแล้ว!",
      });
    }

    const [existsEmail] =
      await conn.query<RowDataPacket[]>(
        `
          SELECT user_id
          FROM users
          WHERE LOWER(email) = LOWER(?)
            AND deleted_flg = 0
          LIMIT 1
        `,
        [cleanEmail]
      );

    if (existsEmail.length > 0) {
      return res.status(400).json({
        message:
          "อีเมลนี้มีบัญชีในระบบแล้ว กรุณาเข้าสู่ระบบ",
      });
    }

    await conn.beginTransaction();

    try {
      const [seqRows] =
        await conn.query<RefNumberRow[]>(
          `
            SELECT prefix, current_value
            FROM ref_number
            WHERE name = 'user'
            FOR UPDATE
          `
        );

      if (seqRows.length === 0) {
        throw new Error(
          "ไม่พบ sequence 'user' ใน ref_number"
        );
      }

      const prefix = seqRows[0].prefix || "US";
      const currentValue =
        seqRows[0].current_value || 0;

      const nextValue = currentValue + 1;

      const userCode =
        `${prefix}${String(nextValue).padStart(3, "0")}`;

      const hashedPassword =
        await bcrypt.hash(cleanPassword, 10);

      await conn.query(
        `
          UPDATE ref_number
          SET current_value = ?
          WHERE name = 'user'
        `,
        [nextValue]
      );

      await conn.query(
        `
          INSERT INTO users
          (
            user_id,
            user_name,
            email,
            user_password,
            role_flg,
            deleted_flg,
            last_login
          )
          VALUES (?, ?, ?, ?, 3, 0, NOW())
        `,
        [
          userCode,
          cleanUsername,
          cleanEmail,
          hashedPassword,
        ]
      );

      await conn.commit();

      const user = {
        user_id: userCode,
        user_name: cleanUsername,
        email: cleanEmail,
        role_flg: 3,
      };

      const token = createUserToken(user);

      return res.status(201).json({
        returnData: {
          user_id: user.user_id,
          user_name: user.user_name,
          email: user.email,
          role: user.role_flg,
        },
        token,
        message: "สมัครสมาชิกสำเร็จ",
      });
    } catch (error) {
      await conn.rollback();
      throw error;
    }
  } catch (err: unknown) {
    console.error("register error:", err);

    return res.status(500).json({
      message: "Server error",
    });
  } finally {
    conn.release();
  }
};

/* =========================================================
   LOGIN EMAIL / USERNAME + PASSWORD
========================================================= */

export const login = async (
  req: Request,
  res: Response
) => {
  const {
    identifier,
    username,
    password,
  } = req.body;

  const loginKey =
    typeof identifier === "string"
      ? identifier.trim()
      : typeof username === "string"
        ? username.trim()
        : "";

  if (
    !loginKey ||
    typeof password !== "string" ||
    !password
  ) {
    return res.status(400).json({
      message:
        "กรุณาระบุอีเมล/ชื่อผู้ใช้ และรหัสผ่าน",
    });
  }

  const conn = await db.getConnection();

  try {
    const [rows] = await conn.query<UserRow[]>(
      `
        SELECT
          user_id,
          user_name,
          email,
          user_password,
          role_flg
        FROM users
        WHERE (
          user_name = ?
          OR LOWER(email) = LOWER(?)
        )
        AND deleted_flg = 0
        LIMIT 1
      `,
      [
        loginKey,
        loginKey,
      ]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        message:
          "อีเมล/ชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง",
      });
    }

    const user = rows[0];

    if (!user.user_password) {
      return res.status(400).json({
        message:
          "บัญชีนี้เข้าใช้งานผ่าน Social Login กรุณาเข้าสู่ระบบด้วย Google หรือ Microsoft",
      });
    }

    const isMatch =
      await bcrypt.compare(
        password,
        user.user_password
      );

    if (!isMatch) {
      return res.status(401).json({
        message:
          "อีเมล/ชื่อผู้ใช้ หรือรหัสผ่านไม่ถูกต้อง",
      });
    }

    await conn.query(
      `
        UPDATE users
        SET last_login = NOW()
        WHERE user_id = ?
      `,
      [user.user_id]
    );

    const token = createUserToken(user);

    return res.json({
      returnData: {
        user_id: user.user_id,
        user_name: user.user_name,
        email: user.email,
        role: user.role_flg,
      },
      token,
    });
  } catch (err: unknown) {
    console.error("login error:", err);

    return res.status(500).json({
      message: "Server error",
    });
  } finally {
    conn.release();
  }
};

/* =========================================================
   PROFILE
========================================================= */

export const getProfile = (
  req: Request,
  res: Response
) => {
  if (!req.user) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  return res.json({
    user_id: req.user.user_id,
    user_name: req.user.user_name,
    email: req.user.email,
    role: req.user.role,
  });
};

/* =========================================================
   GOOGLE - CREATE AUTH URL
========================================================= */

export const getGoogleOAuthUrl = (
  _req: Request,
  res: Response
) => {
  try {
    const clientId =
      process.env.GOOGLE_CLIENT_ID;

    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI;

    if (!clientId || !redirectUri) {
      return res.status(500).json({
        isConfigured: false,
        message:
          "Google OAuth ยังไม่ได้ตั้งค่าใน .env",
      });
    }

    const state = jwt.sign(
      {
        purpose: "google_oauth",
      },
      getJwtSecret(),
      {
        expiresIn: "10m",
      }
    );

    const params =
      new URLSearchParams({
        client_id: clientId,
        redirect_uri: redirectUri,
        response_type: "code",
        scope: "openid email profile",
        state,
        prompt: "select_account",
      });

    const url =
      `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    return res.json({
      isConfigured: true,
      url,
    });
  } catch (err: unknown) {
    console.error(
      "getGoogleOAuthUrl error:",
      err
    );

    return res.status(500).json({
      isConfigured: false,
      message:
        "ไม่สามารถสร้าง Google OAuth URL ได้",
    });
  }
};

/* =========================================================
   GOOGLE CALLBACK
========================================================= */

export const googleCallback = async (
  req: Request,
  res: Response
) => {
  const {
    code,
    error,
    state,
  } = req.query;

  if (
    error ||
    !code ||
    !state
  ) {
    return res.redirect(
      `${FRONTEND_URL}/login?error=google_auth_failed`
    );
  }

  try {
    const stateData = jwt.verify(
      String(state),
      getJwtSecret()
    ) as {
      purpose?: string;
    };

    if (
      stateData.purpose !==
      "google_oauth"
    ) {
      throw new Error(
        "Invalid Google OAuth state"
      );
    }

    const clientId =
      process.env.GOOGLE_CLIENT_ID;

    const clientSecret =
      process.env.GOOGLE_CLIENT_SECRET;

    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI;

    if (
      !clientId ||
      !clientSecret ||
      !redirectUri
    ) {
      throw new Error(
        "Google OAuth configuration missing"
      );
    }

    /* -----------------------------------------------------
       เอา authorization code ไปแลก access token
    ----------------------------------------------------- */

    const tokenRes = await fetch(
      "https://oauth2.googleapis.com/token",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/x-www-form-urlencoded",
        },

        body: new URLSearchParams({
          code: String(code),
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
          grant_type:
            "authorization_code",
        }),
      }
    );

    const tokenData =
      (await tokenRes.json()) as GoogleTokenResponse;

    if (
      !tokenRes.ok ||
      !tokenData.access_token
    ) {
      throw new Error(
        tokenData.error_description ||
          "Google token exchange failed"
      );
    }

    /* -----------------------------------------------------
       ขอ Google profile
    ----------------------------------------------------- */

    const profileRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization:
            `Bearer ${tokenData.access_token}`,
        },
      }
    );

    if (!profileRes.ok) {
      throw new Error(
        "Cannot get Google profile"
      );
    }

    const profile =
      (await profileRes.json()) as GoogleProfile;

    if (
      !profile.id ||
      !profile.email
    ) {
      throw new Error(
        "Google account ไม่มีข้อมูล ID หรือ Email"
      );
    }

    if (
      profile.verified_email === false
    ) {
      throw new Error(
        "Google email ยังไม่ได้รับการยืนยัน"
      );
    }

    /* -----------------------------------------------------
       หา / link / สร้าง user
    ----------------------------------------------------- */

    const result =
      await linkOrCreateOAuthUser({
        provider: "google",
        providerId: profile.id,
        email: profile.email,
        name: profile.name,
      });

    /* -----------------------------------------------------
       Redirect กลับ frontend
    ----------------------------------------------------- */

    const params =
      new URLSearchParams({
        oauth: "success",
        token: result.token,
        user_id:
          result.user.user_id,
        user_name:
          result.user.user_name,
        role:
          String(
            result.user.role_flg
          ),
        email:
          result.user.email || "",
        provider: "Google",
      });

    return res.redirect(
      `${FRONTEND_URL}/login?${params.toString()}`
    );
  } catch (err: unknown) {
    if (
      err instanceof Error
    ) {
      console.error(
        "googleCallback error:",
        err.message
      );
    } else {
      console.error(
        "googleCallback unknown error:",
        err
      );
    }

    return res.redirect(
      `${FRONTEND_URL}/login?error=google_exchange_failed`
    );
  }
};

/* =========================================================
   MICROSOFT - CREATE AUTH URL
========================================================= */

export const getMicrosoftAuthUrl = (
  _req: Request,
  res: Response
) => {
  try {
    const clientId =
      process.env.MICROSOFT_CLIENT_ID;

    const redirectUri =
      process.env.MICROSOFT_REDIRECT_URI ||
      `${BACKEND_URL}/api/auth/microsoft/callback`;

    if (!clientId) {
      return res.status(200).json({
        url:
          `${FRONTEND_URL}/login?oauth_demo=microsoft`,

        isConfigured: false,

        message:
          "Microsoft OAuth ยังไม่ได้ตั้งค่า",
      });
    }

    const state = jwt.sign(
      {
        purpose:
          "microsoft_oauth",
      },
      getJwtSecret(),
      {
        expiresIn: "10m",
      }
    );

    const params =
      new URLSearchParams({
        client_id: clientId,
        response_type: "code",
        redirect_uri:
          redirectUri,
        response_mode: "query",
        scope:
          "openid email profile User.Read",
        state,
      });

    const url =
      `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;

    return res.json({
      url,
      isConfigured: true,
    });
  } catch (err: unknown) {
    console.error(
      "getMicrosoftAuthUrl error:",
      err
    );

    return res.status(500).json({
      message:
        "ไม่สามารถสร้าง Microsoft OAuth URL ได้",
    });
  }
};

/* =========================================================
   MICROSOFT CALLBACK
========================================================= */

export const microsoftCallback =
  async (
    req: Request,
    res: Response
  ) => {
    const {
      code,
      error,
      state,
    } = req.query;

    if (
      error ||
      !code ||
      !state
    ) {
      return res.redirect(
        `${FRONTEND_URL}/login?error=microsoft_auth_failed`
      );
    }

    try {
      const stateData =
        jwt.verify(
          String(state),
          getJwtSecret()
        ) as {
          purpose?: string;
        };

      if (
        stateData.purpose !==
        "microsoft_oauth"
      ) {
        throw new Error(
          "Invalid Microsoft OAuth state"
        );
      }

      const clientId =
        process.env.MICROSOFT_CLIENT_ID;

      const clientSecret =
        process.env.MICROSOFT_CLIENT_SECRET;

      const redirectUri =
        process.env.MICROSOFT_REDIRECT_URI ||
        `${BACKEND_URL}/api/auth/microsoft/callback`;

      if (
        !clientId ||
        !clientSecret
      ) {
        throw new Error(
          "Microsoft OAuth configuration missing"
        );
      }

      const tokenRes =
        await fetch(
          "https://login.microsoftonline.com/common/oauth2/v2.0/token",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/x-www-form-urlencoded",
            },

            body:
              new URLSearchParams({
                client_id:
                  clientId,

                client_secret:
                  clientSecret,

                code:
                  String(code),

                redirect_uri:
                  redirectUri,

                grant_type:
                  "authorization_code",
              }),
          }
        );

      const tokenData =
        (await tokenRes.json()) as MicrosoftTokenResponse;

      if (
        !tokenRes.ok ||
        !tokenData.access_token
      ) {
        throw new Error(
          tokenData.error_description ||
            "Microsoft token exchange failed"
        );
      }

      const profileRes =
        await fetch(
          "https://graph.microsoft.com/v1.0/me",
          {
            headers: {
              Authorization:
                `Bearer ${tokenData.access_token}`,
            },
          }
        );

      if (!profileRes.ok) {
        throw new Error(
          "Cannot get Microsoft profile"
        );
      }

      const profile =
        (await profileRes.json()) as MicrosoftProfile;

      const email =
        profile.mail ||
        profile.userPrincipalName;

      if (
        !profile.id ||
        !email
      ) {
        throw new Error(
          "Microsoft account ไม่มีข้อมูล ID หรือ Email"
        );
      }

      const result =
        await linkOrCreateOAuthUser({
          provider: "microsoft",
          providerId:
            profile.id,
          email,
          name:
            profile.displayName,
        });

      const params =
        new URLSearchParams({
          oauth: "success",
          token:
            result.token,
          user_id:
            result.user.user_id,
          user_name:
            result.user.user_name,
          role:
            String(
              result.user.role_flg
            ),
          email:
            result.user.email || "",
          provider:
            "Microsoft",
        });

      return res.redirect(
        `${FRONTEND_URL}/login?${params.toString()}`
      );
    } catch (
      err: unknown
    ) {
      if (
        err instanceof Error
      ) {
        console.error(
          "microsoftCallback error:",
          err.message
        );
      } else {
        console.error(
          "microsoftCallback unknown error:",
          err
        );
      }

      return res.redirect(
        `${FRONTEND_URL}/login?error=microsoft_exchange_failed`
      );
    }
  };

/* =========================================================
   DEMO SOCIAL LOGIN
========================================================= */

export const demoSocialLogin =
  async (
    req: Request,
    res: Response
  ) => {
    const {
      provider,
      email,
      name,
    } = req.body;

    if (
      !email ||
      !provider
    ) {
      return res.status(400).json({
        message:
          "กรุณาระบุ provider และ email",
      });
    }

    const cleanProvider: OAuthProvider =
      provider === "microsoft"
        ? "microsoft"
        : "google";

    const cleanEmail =
      String(email)
        .trim()
        .toLowerCase();

    const providerId =
      `demo_${cleanProvider}_${Buffer.from(
        cleanEmail
      )
        .toString("hex")
        .slice(0, 16)}`;

    try {
      const result =
        await linkOrCreateOAuthUser({
          provider:
            cleanProvider,

          providerId,

          email:
            cleanEmail,

          name:
            name ||
            cleanEmail.split("@")[0],
        });

      return res.json({
        message:
          result.isLinked
            ? `เข้าสู่ระบบและผูกบัญชี ${cleanProvider} เข้ากับบัญชีเดิมสำเร็จ`
            : `เข้าสู่ระบบด้วย ${cleanProvider} สำเร็จ`,

        token:
          result.token,

        returnData: {
          user_id:
            result.user.user_id,

          user_name:
            result.user.user_name,

          email:
            result.user.email,

          role:
            result.user.role_flg,
        },
      });
    } catch (
      err: unknown
    ) {
      console.error(
        "demoSocialLogin error:",
        err
      );

      return res.status(500).json({
        message:
          "Social login error",
      });
    }
  };
