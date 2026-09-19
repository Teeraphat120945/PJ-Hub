/**
 * validation.ts
 * Centralized validation utilities for Login & Register forms
 */

// ─────────────────────────────────────────────
// EMAIL
// ─────────────────────────────────────────────

/** Standard RFC-compliant email regex (practical subset) */
const EMAIL_REGEX = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;

export interface FieldValidation {
  valid: boolean;
  message: string;
}

export function validateEmail(email: string): FieldValidation {
  const trimmed = email.trim();

  if (!trimmed) {
    return { valid: false, message: "กรุณากรอกอีเมล" };
  }
  if (trimmed.length > 254) {
    return { valid: false, message: "อีเมลยาวเกินไป (สูงสุด 254 ตัวอักษร)" };
  }
  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, message: "รูปแบบอีเมลไม่ถูกต้อง เช่น user@example.com" };
  }

  return { valid: true, message: "" };
}

// ─────────────────────────────────────────────
// USERNAME
// ─────────────────────────────────────────────

/**
 * Rules:
 * - 3–30 characters
 * - a-z, A-Z, 0-9, period (.), underscore (_), hyphen (-)
 * - Must not start or end with . _ -
 * - No consecutive special chars (.._  or -- etc.)
 */
const USERNAME_REGEX = /^[a-zA-Z0-9]([a-zA-Z0-9._-]{1,28}[a-zA-Z0-9])?$|^[a-zA-Z0-9]{1,2}$/;
const CONSECUTIVE_SPECIAL_REGEX = /[._-]{2,}/;

export function validateUsername(username: string): FieldValidation {
  const trimmed = username.trim();

  if (!trimmed) {
    return { valid: false, message: "กรุณากรอกชื่อผู้ใช้งาน" };
  }
  if (trimmed.length < 3) {
    return { valid: false, message: "ชื่อผู้ใช้งานต้องมีอย่างน้อย 3 ตัวอักษร" };
  }
  if (trimmed.length > 30) {
    return { valid: false, message: "ชื่อผู้ใช้งานยาวเกินไป (สูงสุด 30 ตัวอักษร)" };
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(trimmed)) {
    return {
      valid: false,
      message: "ชื่อผู้ใช้งานใช้ได้เฉพาะ a-z, A-Z, 0-9 และ . _ -",
    };
  }
  if (/^[._-]/.test(trimmed) || /[._-]$/.test(trimmed)) {
    return {
      valid: false,
      message: "ชื่อผู้ใช้งานห้ามขึ้นต้นหรือลงท้ายด้วย . _ -",
    };
  }
  if (CONSECUTIVE_SPECIAL_REGEX.test(trimmed)) {
    return {
      valid: false,
      message: "ชื่อผู้ใช้งานห้ามมีอักขระพิเศษติดกัน (เช่น .., __, --)",
    };
  }

  return { valid: true, message: "" };
}

// ─────────────────────────────────────────────
// PASSWORD
// ─────────────────────────────────────────────

export type PasswordStrength = "weak" | "medium" | "strong" | "very-strong";

export interface PasswordStrengthResult {
  strength: PasswordStrength;
  score: number; // 0–4
  label: string;
  color: string;
}

/**
 * Password requirements for Register
 * - At least 8 characters
 * - At least 1 uppercase letter
 * - At least 1 number
 * - Max 128 characters
 */
export interface PasswordRequirements {
  minLength: boolean;    // >= 8
  hasUppercase: boolean; // A-Z
  hasNumber: boolean;    // 0-9
  hasSpecial: boolean;   // !@#$%^&* etc.
  maxLength: boolean;    // <= 128
}

export function getPasswordRequirements(password: string): PasswordRequirements {
  return {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password),
    maxLength: password.length <= 128,
  };
}

export function getPasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return { strength: "weak", score: 0, label: "กรุณากรอกรหัสผ่าน", color: "#e5e7eb" };
  }

  const req = getPasswordRequirements(password);
  let score = 0;

  if (req.minLength) score++;
  if (req.hasUppercase) score++;
  if (req.hasNumber) score++;
  if (req.hasSpecial) score++;
  if (password.length >= 12) score = Math.min(score + 1, 4); // bonus for length

  // Normalize to 0-4
  score = Math.min(score, 4);

  if (score <= 1) return { strength: "weak",        score, label: "อ่อนแอ",      color: "#ef4444" };
  if (score === 2) return { strength: "medium",      score, label: "พอใช้",       color: "#f59e0b" };
  if (score === 3) return { strength: "strong",      score, label: "แข็งแกร่ง",  color: "#10b981" };
  return             { strength: "very-strong",  score, label: "แข็งแกร่งมาก", color: "#059669" };
}

export function validatePassword(password: string): FieldValidation {
  if (!password) {
    return { valid: false, message: "กรุณากรอกรหัสผ่าน" };
  }
  if (password.length < 8) {
    return { valid: false, message: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" };
  }
  if (password.length > 128) {
    return { valid: false, message: "รหัสผ่านยาวเกินไป (สูงสุด 128 ตัวอักษร)" };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: "รหัสผ่านต้องมีตัวอักษรพิมพ์ใหญ่อย่างน้อย 1 ตัว (A-Z)" };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: "รหัสผ่านต้องมีตัวเลขอย่างน้อย 1 ตัว (0-9)" };
  }

  return { valid: true, message: "" };
}

export function validateConfirmPassword(
  password: string,
  confirmPassword: string
): FieldValidation {
  if (!confirmPassword) {
    return { valid: false, message: "กรุณายืนยันรหัสผ่าน" };
  }
  if (password !== confirmPassword) {
    return { valid: false, message: "รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน" };
  }
  return { valid: true, message: "" };
}

// ─────────────────────────────────────────────
// LOGIN IDENTIFIER (email or username)
// ─────────────────────────────────────────────

export function validateLoginIdentifier(identifier: string): FieldValidation {
  const trimmed = identifier.trim();

  if (!trimmed) {
    return { valid: false, message: "กรุณากรอกอีเมล หรือ ชื่อผู้ใช้งาน" };
  }
  if (trimmed.length < 3) {
    return { valid: false, message: "ชื่อผู้ใช้งานต้องมีอย่างน้อย 3 ตัวอักษร" };
  }
  if (trimmed.length > 254) {
    return { valid: false, message: "ข้อมูลยาวเกินไป" };
  }

  return { valid: true, message: "" };
}

export function validateLoginPassword(password: string): FieldValidation {
  if (!password) {
    return { valid: false, message: "กรุณากรอกรหัสผ่าน" };
  }
  if (password.length > 128) {
    return { valid: false, message: "รหัสผ่านยาวเกินไป" };
  }
  return { valid: true, message: "" };
}
