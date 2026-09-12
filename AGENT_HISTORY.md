# ทุกครั้งที่ทำการเเก้ไข Code กรุณาเข้ามาอ่านประวัติการเเก้ไขเเละอัปเดต AGENT_HISTORY.md ให้ถูกต้องด้วย

# ประวัติการทำงานและการแก้ไขโค้ด (AGENT HISTORY)

---

## 📌 [2026-09-13] ตรวจสอบความถูกต้องและปรับแต่งระบบสำหรับใช้งานจริงระดับ Production (Comprehensive Code Audit & Hardening)

- **แก้ไขข้อผิดพลาดการตรวจสอบสิทธิ์ในหน้าแก้ไขผลงาน (`AssignmentEdit.tsx`):**
  - **ปัญหาที่พบก่อนหน้า:** หน้าจอ `AssignmentEdit.tsx` ตรวจสอบสิทธิ์โดยเช็คเฉพาะ `!isOwner && !isClassOwner && !isAdmin` ทำให้ข้ามการตรวจสอบอาจารย์ผู้รับผิดชอบรายวิชาที่ลงทะเบียนไว้ใน `class_users` (`is_class_responsible`) ส่งผลให้อาจารย์ผู้ร่วมสอนถูกระบบปฏิเสธสิทธิ์ (Permission Denied) แม้ว่า Backend API จะอนุญาตแล้วก็ตาม
  - **การปรับปรุงแก้ไข:** ปรับเงื่อนไขการตรวจสอบสิทธิ์ให้ครอบคลุมและสอดคล้องกับ Backend:
    `const canEdit = Boolean(res.can_edit ?? (isOwner || isClassOwner || isAdmin || res.is_class_responsible));` ป้องกันการล็อกเอาต์หรือปฏิเสธสิทธิ์ผิดพลาด
- **ปรับปรุงความสะอาดของข้อมูลและการทำ Sanitization ลิงก์ภายนอก (`assignment.controller.ts`):**
  - **ปัญหาที่พบก่อนหน้า:** การบันทึก `link || null` อาจทำให้กรณีที่ผู้ใช้เผลอกดเคาะเว้นวรรค (Whitespace-only เช่น `"   "`) ถูกบันทึกเป็นสตริงว่างลงในตาราง `class_assignments` ทำให้ฐานข้อมูลบันทึกเป็น `NOT NULL` และระบบประเมินว่ามีลิงก์แนบอยู่จริง
  - **การปรับปรุงแก้ไข:** เพิ่มการ Trim ค่าว่าง `link && link.trim() ? link.trim() : null` ทั้งใน `createAssignment` และ `updateAssignment` เพื่อรับประกัน Data Integrity ในฐานข้อมูล MySQL
- **ยกระดับความเป็นส่วนตัวในการเรียนการสอน (Scoped Privacy in `ClassDetail.tsx`):**
  - จำกัดการมองเห็น Badge แจ้งเตือน `⚠️ ไม่มีไฟล์/ลิงก์` บนการ์ดผลงานในหน้ารายวิชา ให้แสดงเฉพาะกับ**อาจารย์ผู้รับผิดชอบรายวิชา** (`isClassResponsible`) และ**เจ้าของผลงาน** (`isAssignmentOwner`) เท่านั้น
  - ไม่แสดงป้ายแจ้งเตือนนี้แก่นิสิตคนอื่นในรายวิชา เพื่อรักษาความเป็นส่วนตัวในการเรียนการสอน (Academic Privacy) และป้องกันไม่ให้เกิดความรู้สึกถูกประจาน
- **เพิ่มความทนทานต่อ State และแยกการแสดงผลตามบทบาทผู้ใช้ (`AssignmentDetail.tsx`):**
  - ปรับปรุงการคำนวณ `hasFiles`, `hasLink`, `hasNoResources` โดยเพิ่มการตรวจสอบ Null-safety: `Boolean(assignment && !hasFiles && !hasLink)` ป้องกันการคำนวณผิดพลาดขณะกำลังโหลดข้อมูล
  - แยกการแสดงผลแถบแจ้งเตือนระหว่างผู้มีสิทธิ์จัดการผลงาน (แสดงไอคอน `<FiAlertTriangle />` สีทองอำพันเตือนให้แนบไฟล์/ลิงก์) และผู้เข้าชมทั่วไป (แสดงไอคอน `<FiAlertCircle />` โทนสีสุภาพแบบ Informational พร้อมข้อความระบุว่าอยู่ระหว่างการจัดเตรียมเนื้อหา)
- **ไฟล์ที่แก้ไข:**
  - `backend/src/controllers/assignment.controller.ts`
  - `frontend/src/pages/assignment/AssignmentEdit.tsx`
  - `frontend/src/pages/assignment/AssignmentDetail.tsx`
  - `frontend/src/pages/class/ClassDetail.tsx`
  - `frontend/src/pages/assignment/AssignmentManagement.tsx`
  - `AGENT_HISTORY.md`

---

## 📌 [2026-09-13] ปรับแต่งการแสดงผลกรณีผลงานไม่มีไฟล์แนบหรือลิงก์ภายนอก พร้อมแจ้งเตือนเจ้าของผลงานและผู้รับผิดชอบรายวิชา (Missing Resources Notification & Indicators)

- **แจ้งเตือนและระบุสถานะทรัพยากรเมื่อผลงานไม่มีไฟล์และไม่มีลิงก์ภายนอก (`has_no_resources`):**
  - **สำหรับเจ้าของผลงาน (`isWorkOwner`):**
    - แสดงกล่องแจ้งเตือนสีเหลืองทองสะดุดตา (`missing-resources-alert-banner`) เตือนว่า *"ผลงานนี้ยังไม่มีการแนบไฟล์เอกสารหรือระบุลิงก์ผลงาน"* พร้อมชี้แจงว่าเพื่อให้ผลงานมีความสมบูรณ์ พร้อมสำหรับการตรวจประเมิน และเผยแพร่สู่คลังความรู้ ควรอัปโหลดไฟล์รายงานหรือระบุลิงก์
    - มีปุ่มทางลัด *"แก้ไขผลงานเพื่อแนบไฟล์ / ใส่ลิงก์"* นำทางไปยังหน้าแก้ไขผลงานทันที
    - มีป้ายกำกับสถานะผู้เข้าชม: *"📌 คุณเข้าชมในสถานะ: เจ้าของผลงาน"*
  - **สำหรับผู้รับผิดชอบรายวิชา / อาจารย์ / Admin (`isCourseInstructor`):**
    - แสดงกล่องแจ้งเตือนสำหรับผู้ดูแล *"⚠️ แจ้งเตือนผู้รับผิดชอบรายวิชา / ผู้ดูแลระบบ (Resource Alert)"* ระบุว่านิสิตยังไม่ได้แนบไฟล์หรือระบุลิงก์ภายนอก
    - อาจารย์/Admin สามารถประสานงานแจ้งเตือนนิสิต หรือกดปุ่ม *"แก้ไขผลงานเพื่อแนบไฟล์ / ใส่ลิงก์"* เพื่อช่วยแนบไฟล์หรือแก้ไขข้อมูลได้โดยตรง
    - มีป้ายกำกับสถานะผู้เข้าชม: *"📌 คุณเข้าชมในสถานะ: ผู้รับผิดชอบรายวิชา / ผู้ดูแลระบบ"*
  - **สำหรับผู้เข้าชมทั่วไป / นิสิตคนอื่น (General Visitors):**
    - แสดงข้อความสุภาพ นุ่มนวล (`missing-resources-info-banner`): *"ยังไม่มีไฟล์หรือลิงก์แนบ: ผลงานนี้ยังไม่มีการแนบไฟล์เอกสารหรือลิงก์ภายนอก (อยู่ระหว่างการจัดเตรียมเนื้อหาโดยผู้จัดทำ)"* เพื่อไม่ให้เกิดความสับสน
- **ปรับปรุงลดความซ้ำซ้อนของไอคอนและปุ่ม (Eliminating Redundant Icons & Buttons - Clean UI):**
  - **นำปุ่มและไอคอนส่วนเกินในหน้าดูผลงานออก:**
    - นำปุ่ม `+ แนบไฟล์` และ `+ เพิ่มลิงก์` ในกล่องทรัพยากรว่างเปล่าออก คืนค่ากล่องข้อความอ่านอย่างเดียวที่เรียบง่าย สะอาดตา (`<div className="readonly-box empty-box">ไม่มีไฟล์แนบ</div>` และ `ไม่มีลิงก์ภายนอก`) เพื่อไม่ให้มีปุ่มแก้ไขซ้ำซ้อนกันหลายตำแหน่ง และปล่อยให้ปุ่ม "แก้ไขผลงาน" ที่ส่วนหัวหน้าเว็บทำหน้าที่เป็นปุ่มหลักเพียงจุดเดียว
    - ปรับแถบแจ้งเตือนเตือนทรัพยากรขาดหายให้เป็นแถบแจ้งเตือนแบบมินิมอล กระชับ (`missing-resources-notice`) ใช้ไอคอนแจ้งเตือนเพียงจุดเดียว (`<FiAlertTriangle size={18} />`) พร้อมข้อความแจ้งเตือนที่ตรงประเด็นสำหรับเจ้าของผลงานและผู้รับผิดชอบรายวิชา
    - ลบแบนเนอร์แจ้งเตือนซ้ำซ้อนในแผงการดูแลรักษา (`lifecycle-completeness-banner`) ออก เพื่อให้แผงดูแลรักษาคงความสะอาดตาและแสดงเฉพาะตัวชี้วัดที่จำเป็น
  - **ลดความแออัดของการ์ดผลงานในหน้ารายวิชาและหน้าจัดการผลงาน:**
    - นำชิปแสดงจำนวนไฟล์และลิงก์ปกติ (`📄 X ไฟล์`, `🔗 มีลิงก์`) ออกจากการ์ดผลงานทุกชิ้น
    - แสดงเฉพาะป้ายแจ้งเตือน `⚠️ ไม่มีไฟล์/ลิงก์` สำหรับผลงานที่ขาดทรัพยากรจริง ๆ เท่านั้น ทำให้การ์ดผลงานทั่วไปดูสบายตา ไม่ถูกรบกวนด้วยไอคอนที่มากเกินไป
- **Backend API (`backend/src/controllers/assignment.controller.ts`):**
  - ปรับปรุง `getAssignment` (`GET /api/assignment/get-assignment/:classId`): คืนค่า `file_count`, `has_files`, `has_link`, `has_no_resources`
  - ปรับปรุง `getAssignmentByUser` (`GET /api/assignment/get-assignment-by-user`): คืนค่า `file_count`, `assignment_link`, `class_created_by`, `has_files`, `has_link`, `has_no_resources` ทั้งในโหมดดูผลงานทั้งหมดของ Admin และโหมดดูเฉพาะผลงานตนเอง
  - ปรับปรุง `getAssignmentDetail` (`GET /api/assignment/get-detail/:assignment_id`): คืนค่า `file_count`, `has_files`, `has_link`, `has_no_resources` ให้ตรงกัน
- **ไฟล์ที่แก้ไข:**
  - `backend/src/controllers/assignment.controller.ts`
  - `frontend/src/services/assignment.service.ts`
  - `frontend/src/pages/assignment/AssignmentDetail.tsx`
  - `frontend/src/css/assignments/AssignmentDetail.css`
  - `frontend/src/pages/assignment/AssignmentManagement.tsx`
  - `frontend/src/css/assignments/AssignmentManagement.css`
  - `frontend/src/pages/class/ClassDetail.tsx`
  - `frontend/src/css/classes/ClassDetail.css`
  - `AGENT_HISTORY.md`

---

## 📌 [2026-09-13] สิทธิ์และการมองเห็นข้อมูลผลงานและรายวิชาทั้งหมดสำหรับผู้ดูแลระบบ (Admin Full Visibility & Data Sync for Old Users' Data)

- **แก้ไขปัญหา Admin ใหม่และผู้ได้รับการแต่งตั้งใหม่มองไม่เห็นข้อมูลของผู้ใช้รายเก่า:**
  - **Backend API (`GET /api/assignment/get-assignment-by-user`):**
    - ตรวจสอบ `currentRole` ล่าสุดจากตาราง `users` ในฐานข้อมูล
    - เมื่อผู้ใช้เป็น Admin (`role_flg = 0`) และไม่ได้ระบุ `only_me=true`: จะส่งคืนผลงานทั้งหมดในระบบจากผู้ใช้ทุกคนที่ยังไม่ถูกลบ พร้อมชื่อผู้จัดทำ (`author_name`), บทบาทผู้จัดทำ (`author_role`) และชื่อรายวิชา (`class_name`)
    - รองรับ Query Parameter `?only_me=true` ให้ Admin เลือกดูเฉพาะผลงานที่ตนเองสร้างได้
    - เรียก `syncAdminsToClasses(conn)` อัตโนมัติ เพื่อประกันว่า Admin มีสิทธิ์ครบทุกรายวิชาในระบบ
  - **การตรวจสอบสิทธิ์แบบเรียลไทม์จากฐานข้อมูล (Dynamic Role Verification):**
    - ปรับปรุงฟังก์ชัน `createAssignment`, `updateAssignment`, `deleteAssignment` ใน `assignment.controller.ts` และ `getClassUsers`, `addClassUser`, `removeUser` ใน `classUser.controller.ts` ให้ดึง `role_flg` ล่าสุดจากตาราง `users` โดยตรง เพื่อให้ผู้ใช้ที่เพิ่งได้รับการเลื่อนขั้นเป็น Admin มีสิทธิ์ดูแลระบบได้ทันทีโดยไม่ต้องรอ Refresh Token
    - ปรับปรุง `login` และ OAuth Login ใน `auth.controller.ts` ให้เรียก `syncAdminsToClasses` เมื่อผู้ใช้เป็น Admin
    - ปรับปรุง `class.controller.ts:view` ให้ตั้งค่า `is_enrolled = 1` ให้ผู้ดูแลระบบทุกรายวิชาเสมอ
- **ยกระดับหน้าจอจัดการผลงาน (`AssignmentManagement.tsx` & `AssignmentManagement.css`):**
    - **Header สอดคล้องกับบทบาท:** แสดงชื่อหน้า "ผลงานทั้งหมดในระบบ (ดูแลระบบ)" พร้อมคำอธิบายจำนวนผลงานทั้งหมดที่สามารถกำกับดูแลได้
    - **แท็บสลับมุมมองสำหรับ Admin (Admin Toolbar & Tabs):**
      - `📚 ผลงานทั้งหมดในระบบ` พร้อม Badge นับจำนวนผลงานทั้งหมด
      - `👤 ผลงานที่ฉันสร้าง` พร้อม Badge นับจำนวนผลงานที่ Admin เป็นผู้สร้าง
    - **ระบบค้นหา Real-time Search Box:** ค้นหาผลงานได้สะดวกรวดเร็วตามชื่อผลงาน, รหัสวิชา, ชื่อวิชา หรือชื่อผู้จัดทำ
    - **ป้ายแสดงผู้จัดทำผลงาน (Author Badge):** แสดงชิปไอคอนรูปผู้ใช้ `<FiUser /> {author_name}` บนการ์ดผลงานอย่างชัดเจน
    - **Sidebar Navigation:** สำหรับผู้ดูแลระบบ ปรับป้ายเมนูด้านซ้ายเป็น "จัดการผลงาน" (พร้อม Tooltip: จัดการผลงานทั้งหมดในระบบ)
- **ไฟล์ที่แก้ไข:**
  - `backend/src/controllers/assignment.controller.ts`
  - `backend/src/controllers/class.controller.ts`
  - `backend/src/controllers/auth.controller.ts`
  - `backend/src/controllers/classUser.controller.ts`
  - `frontend/src/services/assignment.service.ts`
  - `frontend/src/layouts/MainLayout.tsx`
  - `frontend/src/pages/assignment/AssignmentManagement.tsx`
  - `frontend/src/css/assignments/AssignmentManagement.css`
  - `AGENT_HISTORY.md`

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
