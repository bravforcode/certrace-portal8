# 🏗️ โครงสร้างสถาปัตยกรรมระบบ Certrace (Project Structure & Architecture)

เอกสารนี้สรุปโครงสร้างการทำงานของระบบ **Certrace** ทั้งหมด เพื่อให้เข้าใจง่ายว่าแต่ละส่วนประกอบ (Components) มีหน้าที่อะไร มีเป้าหมายอะไร และใช้เทคโนโลยี (Tech Stack) อะไรในการพัฒนา

---

## 🗺️ ภาพรวมสถาปัตยกรรม (System Architecture Overview)

ระบบ Certrace ถูกแบ่งออกเป็น **3 ส่วนหลัก** เพื่อแยกหน้าที่ออกจากกันอย่างชัดเจน (Separation of Concerns):

```mermaid
graph TD
    subgraph หน้าบ้านผู้ใช้ทั่วไป (Public Web)
        LP[Landing Page / Waitlist]
    end

    subgraph ระบบหน้าบ้านของผู้ใช้งาน (Frontend Apps)
        CP[Customer Portal - Exporters & Suppliers]
    end

    subgraph ระบบประมวลผลหลังบ้าน (Backend & DB)
        BE[FastAPI Backend - Calculation Engine]
        DB[(PostgreSQL Database)]
    end

    LP -- 1. ลงทะเบียนและจองเวลา --> LP
    CP -- 2. ดึง/ส่งข้อมูลการรายงานภาษี --> BE
    BE -- 3. บันทึกและดึงข้อมูล --> DB
```

---

## 📂 รายละเอียดของแต่ละส่วนประกอบ (Detailed Components)

### 1. 📣 Landing Page / Pre-launch Web
*   **ที่อยู่โฟลเดอร์/ไฟล์:** [landingpage/certrace-landing](landingpage/certrace-landing)
*   **มีไว้ทำไม (Purpose):** 
    *   ใช้สำหรับเป็นหน้าเว็บชวนเชื่อในการทำ **Cold Outreach** (เข้าหาผู้ส่งออกโดยตรง) 
    *   สร้างความน่าเชื่อถือให้กับผู้ส่งออกเหล็กและอลูมิเนียมชาวไทย ให้เข้าใจปัญหาเรื่องกำแพงภาษีคาร์บอน (CBAM) ของสหภาพยุโรป ภายใน 30-60 วินาที
*   **หน้าที่หลัก (Key Features):**
    *   **Waitlist Form:** กรอกอีเมลเพื่อขอเข้าร่วมใช้งานล่วงหน้า (เชื่อมโยงผ่าน Google Apps Script เข้า Google Sheets)
    *   **Call Booking:** ปุ่มกดจองคิวพูดคุย 15 นาทีกับผู้ร่วมก่อตั้ง (เชื่อมโยงผ่าน Calendly)
*   **เทคโนโลยีที่ใช้ (Tech Stack):** 
    *   Pure HTML, Vanilla CSS และ Vanilla JavaScript (ไม่มี Build step ทำให้โหลดหน้าเว็บได้เร็วที่สุดในหลักมิลลิวินาที)

---

### 💼 2. Customer Portal (ระบบสำหรับลูกค้าและคู่ค้า)
*   **ที่อยู่โฟลเดอร์:** [certrace-portal](certrace-portal)
*   **มีไว้ทำไม (Purpose):** 
    *   เป็นศูนย์กลางระบบ B2B SaaS ที่ให้ผู้ส่งออก (Exporters) จัดการเตรียมรายงาน CBAM ของบริษัท และเชื่อมโยงข้อมูลกับโรงงานคู่ค้า (Suppliers)
*   **หน้าที่หลัก (Key Features):**
    *   **Exporter Dashboard:** หน้าแดชบอร์ดหลักแสดงสถานะของรายงานการส่งออก (Declarations) และภาพรวมความพร้อมของข้อมูล
    *   **Supplier Smart Links (`/s/[token]`):** เป็นลิงก์ปลอดภัยที่ส่งให้ซัพพลายเออร์กรอกข้อมูลการปล่อยคาร์บอนของตนเอง โดยซัพพลายเออร์ **ไม่ต้องสมัครสมาชิกหรือเข้าสู่ระบบ** กรอกข้อมูลเสร็จ ข้อมูลจะไหลกลับเข้ารายงานของผู้ส่งออกทันที
    *   **Report Generation:** ระบบรวบรวมตัวเลขและออกไฟล์รายงานคาร์บอนตามเกณฑ์ EU CBAM
*   **เทคโนโลยีที่ใช้ (Tech Stack):** 
    *   Next.js (React), TypeScript, PostCSS
    *   ติดตั้งระบบเตรียม Deploy บน Cloudflare Pages (ผ่าน OpenNext / Wrangler)

---

### ⚙️ 3. Compliance Backend API (ระบบประมวลผลหลัก)
*   **ที่อยู่โฟลเดอร์:** [certrace-backend](certrace-backend)
*   **มีไว้ทำไม (Purpose):** 
    *   เป็นสมองส่วนกลางในการคิดคำนวณ รักษาความปลอดภัยของข้อมูล และติดต่อจัดการกับฐานข้อมูลให้ Customer Portal
*   **หน้าที่หลัก (Key Features):**
    *   **CBAM Calculation Engine:** ประมวลผลและคำนวณหาปริมาณ Embedded Carbon (ค่าการปล่อยคาร์บอนแฝง) ตามเกณฑ์ทางเคมีและพลังงานของ EU
    *   **Database Management:** บันทึกข้อมูลความสัมพันธ์ในฐานข้อมูล (PostgreSQL) โดยมี alembic migration ใน [certrace-backend/migrations/versions](certrace-backend/migrations/versions) เป็น source of truth ชุดเดียวของ schema
    *   **Authentication & Security:** จัดการแฮชรหัสผ่านของผู้ใช้ (PBKDF2) และออก JWT Token สำหรับตรวจสอบสิทธิ์การเข้าใช้งาน API
*   **เทคโนโลยีที่ใช้ (Tech Stack):** 
    *   Python 3, FastAPI, PostgreSQL (`psycopg2`), JWT (PyJWT)

---

### 📧 4. Outreach & Data Scripts (ระบบอัตโนมัติหาลูกค้า)
*   **ที่อยู่ไฟล์:** [archive/business/send_emails.py](archive/business/send_emails.py), [archive/business/send_interview_invites.py](archive/business/send_interview_invites.py) (เก็บไว้เป็น archive ไม่ได้ใช้งานประจำ)
*   **มีไว้ทำไม (Purpose):** 
    *   ใช้สำหรับรันแบบอัตโนมัติในการดึงข้อมูลจากใบรายชื่อบริษัทผู้ส่งออกเหล็กและอลูมิเนียมในไทย ส่งอีเมลแนะนำแบรนด์/ชวนสัมภาษณ์
*   **เทคโนโลยีที่ใช้ (Tech Stack):** 
    *   Python เชื่อมต่อกับ **Resend API** ส่งผ่านอีเมลแบรนด์ที่ผูก DNS ไว้
