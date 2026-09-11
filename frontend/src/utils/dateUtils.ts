/**
 * Utility ฟังก์ชันสำหรับแปลงและคำนวณ วันที่ ปี พ.ศ. และอายุการจัดเก็บทรัพยากร (Retention & Lifecycle)
 */

const THAI_MONTHS_FULL = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

const THAI_MONTHS_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

export const formatThaiYear = (date?: string | Date | null): string => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const yearBE = d.getFullYear() + 543;
  return `พ.ศ. ${yearBE}`;
};

export const getThaiYearNumber = (date?: string | Date | null): number | null => {
  if (!date) return null;
  const d = new Date(date);
  if (isNaN(d.getTime())) return null;
  return d.getFullYear() + 543;
};

/**
 * จัดรูปแบบวันที่แบบเต็มภาษาไทย พร้อมปี พ.ศ. เช่น "11 กันยายน พ.ศ. 2569"
 */
export const formatThaiFullDate = (date?: string | Date | null): string => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const day = d.getDate();
  const month = THAI_MONTHS_FULL[d.getMonth()];
  const yearBE = d.getFullYear() + 543;
  return `${day} ${month} พ.ศ. ${yearBE}`;
};

/**
 * จัดรูปแบบวันที่แบบย่อภาษาไทย พร้อมปี พ.ศ. เช่น "11 ก.ย. 2569"
 */
export const formatThaiShortDate = (date?: string | Date | null): string => {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const day = d.getDate();
  const month = THAI_MONTHS_SHORT[d.getMonth()];
  const yearBE = d.getFullYear() + 543;
  return `${day} ${month} ${yearBE}`;
};

export type ExpiryInfo = {
  createdDate: Date;
  expiryDate: Date;
  createdFormatted: string;
  expiryFormatted: string;
  totalDays: number;
  daysRemaining: number;
  daysElapsed: number;
  percentElapsed: number;
  isExpired: boolean;
  isExpiringSoon: boolean;
  isPermanentStorage: boolean;
  status: "healthy" | "warning" | "expired";
  statusLabel: string;
  remainingLabel: string;
  badgeClass: string;
};

/**
 * คำนวณรอบการดูแลรักษาและทบทวนคุณภาพผลงาน
 * ไฟล์แนบจะถูกจัดเก็บบนระบบอย่างถาวร ส่วนระยะเวลา 365 วันคือรอบทบทวนคุณภาพและความถูกต้องของลิงก์ภายนอก
 * @param createdDateStr วันที่จัดทำ/อัปโหลดผลงาน
 * @param retentionDays จำนวนวันของรอบทบทวนคุณภาพ (ค่าเริ่มต้น 365 วัน / 1 ปีการศึกษา)
 */
export const calculateExpiryInfo = (
  createdDateStr?: string | Date | null,
  retentionDays = 365,
): ExpiryInfo | null => {
  if (!createdDateStr) return null;
  const createdDate = new Date(createdDateStr);
  if (isNaN(createdDate.getTime())) return null;

  const expiryDate = new Date(createdDate.getTime() + retentionDays * 24 * 60 * 60 * 1000);
  const now = new Date();

  const diffMs = expiryDate.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  const daysElapsed = Math.max(0, retentionDays - daysRemaining);
  const percentElapsed = Math.min(100, Math.max(0, Math.round((daysElapsed / retentionDays) * 100)));

  const isExpired = daysRemaining <= 0;
  const isExpiringSoon = daysRemaining > 0 && daysRemaining <= 30;

  let status: "healthy" | "warning" | "expired" = "healthy";
  let statusLabel = "สมบูรณ์ (ไฟล์จัดเก็บถาวร / ลิงก์พร้อมใช้งาน)";
  let badgeClass = "expiry-badge-healthy";

  if (isExpired) {
    status = "expired";
    statusLabel = "ถึงรอบทบทวนคุณภาพประจำปี";
    badgeClass = "expiry-badge-expired";
  } else if (isExpiringSoon) {
    status = "warning";
    statusLabel = "ใกล้ถึงรอบทบทวนคุณภาพประจำปี";
    badgeClass = "expiry-badge-warning";
  }

  let remainingLabel = "";
  if (isExpired) {
    const overdueDays = Math.abs(daysRemaining);
    remainingLabel = overdueDays === 0 ? "ถึงรอบทบทวนวันนี้" : `เลยรอบทบทวนมา ${overdueDays} วัน`;
  } else {
    remainingLabel = `เหลือเวลาทบทวนอีก ${daysRemaining} วัน`;
  }

  return {
    createdDate,
    expiryDate,
    createdFormatted: formatThaiFullDate(createdDate),
    expiryFormatted: formatThaiFullDate(expiryDate),
    totalDays: retentionDays,
    daysRemaining,
    daysElapsed,
    percentElapsed,
    isExpired,
    isExpiringSoon,
    isPermanentStorage: true,
    status,
    statusLabel,
    remainingLabel,
    badgeClass,
  };
};
