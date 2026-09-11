# ทุกครั้งที่ทำการเเก้ไข Code กรุณาเข้ามาอ่านประวัติการเเก้ไขเเละอัปเดต AGENT_HISTORY.md ให้ถูกต้องด้วย

# ประวัติการทำงานและการแก้ไขโค้ด (AGENT HISTORY)

---

## 📌 [2026-09-11] ระบบจัดเก็บไฟล์ถาวรและระบบตรวจสุขภาพลิงก์ผลงานพร้อมแจ้งเตือนการบำรุงรักษา (Permanent Storage & Link Health Checker)

- **ไฟล์แนบจัดเก็บถาวร (Permanent Storage):**
  - ยืนยันว่าไฟล์ที่แนบมากับผลงานทั้งหมดในระบบ UP PJ-Hub ถูกจัดเก็บบนเซิร์ฟเวอร์อย่าง**ถาวรตลอดไป (Permanent Storage)** ไม่มีการลบอัตโนมัติ
  - ตัวนับเวลา 365 วัน (1 ปีการศึกษา) ถูกระบุและสื่อสารอย่างชัดเจนใน UI ว่าเป็น **"รอบทบทวนคุณภาพผลงานประจำปี (Annual Quality Review Cycle)"** เพื่อให้ผู้จัดทำเข้ามาตรวจเช็คความสดใหม่ของเนื้อหาและความพร้อมใช้งานของลิงก์ภายนอก
  - เพิ่มป้าย `📁 จัดเก็บถาวร (Permanent Storage)` บนส่วนไฟล์แนบ, แผงการดูแลรักษา และการ์ดผลงานในหน้า `AssignmentManagement.tsx`
- **ระบบตรวจสอบสุขภาพลิงก์ผลงาน (Link Health Checker & Verification):**
  - **Backend API (`POST /api/assignment/check-link`):**
    - ใช้ `fetch` พร้อม `AbortController` (Timeout 6 วินาที) ตรวจสอบการเชื่อมต่อไปยัง URL ปลายทาง
    - รองรับ Fallback จาก `HEAD` ไป `GET` (Range: bytes=0-100) สำหรับบริการที่บล็อก HEAD เช่น Google Drive, GitHub
    - จำแนกสถานะการตอบกลับอย่างแม่นยำ:
      - `200..399`: ลิงก์พร้อมใช้งานปกติ (Healthy)
      - `401/403`: ลิงก์ถูกจำกัดสิทธิ์ / ยังไม่เปิดแชร์สาธารณะ (Restricted / Private)
      - `404/410`: ไม่พบหน้าเว็บหรือไฟล์ถูกลบไปแล้ว (Not Found)
      - `Timeout / Network Error`: ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ปลายทางได้ ลิงก์เสียหรือโดเมนหมดอายุ
  - **Frontend Service & Auto-Check:**
    - ฟังก์ชัน `checkLinkService(url)` ใน `assignment.service.ts`
    - ตรวจสอบสถานะการเข้าถึงลิงก์อัตโนมัติทันทีที่เปิดดูผลงาน พร้อมปุ่ม "ตรวจสถานะลิงก์" เพื่อทดสอบซ้ำได้ทุกเวลา
- **🚨 กล่องแจ้งเตือนการบำรุงรักษาในหน้าเมนเทน (Maintenance Alert Banner):**
  - เมื่อระบบตรวจพบว่าลิงก์ภายนอกมีปัญหา (404, 403, Timeout, หรือ Network Error) จะแสดง **กล่องแจ้งเตือนการบำรุงรักษาสีแดงสะดุดตา (Maintenance Alert Banner)** บนแผงดูแลรักษาของเจ้าของผลงานและอาจารย์ผู้รับผิดชอบวิชาทันที
  - แสดงรหัส HTTP Status Code (เช่น `HTTP 404`, `HTTP 403`) พร้อมคำอธิบายสาเหตุที่เป็นภาษาไทยเข้าใจง่าย
  - มีปุ่ม Action ทางลัด:
    - `✏️ แก้ไขเพื่อเปลี่ยนลิงก์ผลงาน`: นำทางไปยังหน้าแก้ไขผลงานทันที
    - `🔄 ตรวจสอบลิงก์อีกครั้ง`: สั่ง Re-test การเชื่อมต่อไปยังปลายทางแบบ Real-time
  - หากลิงก์พร้อมใช้งานปกติ จะแสดงกล่องยืนยันสีเขียว `🟢 ลิงก์ภายนอกพร้อมใช้งานปกติ`
- **ไฟล์ที่แก้ไข:**
  - `backend/src/controllers/assignment.controller.ts`
  - `backend/src/routes/assignment.routes.ts`
  - `frontend/src/services/assignment.service.ts`
  - `frontend/src/utils/dateUtils.ts`
  - `frontend/src/pages/assignment/AssignmentDetail.tsx`
  - `frontend/src/css/assignments/AssignmentDetail.css`
  - `frontend/src/pages/assignment/AssignmentManagement.tsx`
  - `frontend/src/css/assignments/AssignmentManagement.css`
  - `AGENT_HISTORY.md`

---

## 📌 [2026-09-11] ระบบปี พ.ศ. และ Badge สำหรับรายวิชาและผลงาน (Buddhist Era Tags & Search)

- **ค้นหาปี พ.ศ.:** ระบบแปลงปี พ.ศ. ($\ge 2500$) เป็น ค.ศ. (ลบ 543) อัตโนมัติ เพื่อเปรียบเทียบกับ `YEAR(created_datetime)` ใน SQL
- **Badge ปี พ.ศ.:** แสดง Badge ปี พ.ศ. โทนสีทองอำพัน (`พ.ศ. 2568` พร้อมไอคอน `FiCalendar`) บนการ์ดรายวิชาและผลงานในทุกหน้า
- **ไฟล์ที่แก้ไข:** `dateUtils.ts`, `class.controller.ts`, `assignment.controller.ts`, `Home.tsx`, `ClassDetail.tsx`, `TeacherClassManagement.tsx`, `AssignmentDetail.tsx`, `AssignmentManagement.tsx`

---

## 📌 [2026-09-11] ระบบดาวน์โหลดไฟล์และสิทธิ์การเข้าถึง (Assignment File Download & Permissions)

- **แก้ไข Endpoint:** แก้ไข Path ซ้ำซ้อนจาก `/api/assignment/assignment/file/...` เป็น `/api/assignment/file/...`
- **ตรวจสอบสิทธิ์แบบครอบคลุม:** ดึง `role_flg` ปัจจุบันจากตาราง `users` และตรวจสิทธิ์เจ้าของผลงาน, ผู้รับผิดชอบรายวิชา, สมาชิกในวิชา (`class_users`), อาจารย์ และ Admin
- **Dynamic File Path:** แก้ปัญหา File not found จาก CWD โดยค้นหาไฟล์จากหลาย Candidate paths ทั้งระดับ Root และ Backend
- **CORS & Encoding:** เพิ่ม `exposedHeaders: ["Content-Disposition"]` และถอดรหัส RFC 5987 รองรับชื่อไฟล์ภาษาไทยสมบูรณ์
- **ไฟล์ที่แก้ไข:** `backend/src/index.ts`, `assignment.routes.ts`, `assignment.controller.ts`, `assignment.service.ts`, `AssignmentDetail.tsx`, `AssignmentDetail.css`

### ตารางสิทธิ์การเข้าถึงข้อมูลผลงาน (Access Matrix)

| บทบาท / สถานะผู้ใช้ | ดูข้อมูลทั่วไป | ลิงก์ภายนอก | ดาวน์โหลดไฟล์ | คอมเมนต์ | แก้ไข/ลบ | แผงดูแลรักษา (อายุไฟล์/ลิงก์) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Admin (Role 0)** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **อาจารย์ผู้รับผิดชอบวิชา (Class Owner)** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **เจ้าของผลงาน (Work Owner)** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **อาจารย์ทั่วไป (Role 1) / นิสิต (Role 2)** | ✅ | ✅ | ✅ | อ่านได้ | ❌ | ❌ |
| **ผู้ใช้นอกวิชา / Guest (Role 3)** | ✅ | 🔒 จำกัดสิทธิ์ | 🔒 จำกัดสิทธิ์ | อ่านได้ | ❌ | ❌ |
