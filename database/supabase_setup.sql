-- ====================================================================
-- SIMS 4.0 - COMPLETE SUPABASE SETUP SCRIPT
-- Copy entire content into Supabase -> SQL Editor -> Run
-- ====================================================================

-- 1. DROP EXISTING TABLES IF NEEDED
DROP TABLE IF EXISTS "notifications" CASCADE;
DROP TABLE IF EXISTS "supervision_requests" CASCADE;
DROP TABLE IF EXISTS "import_logs" CASCADE;
DROP TABLE IF EXISTS "scores" CASCADE;
DROP TABLE IF EXISTS "comments" CASCADE;
DROP TABLE IF EXISTS "weekly_reports" CASCADE;
DROP TABLE IF EXISTS "internship_assignments" CASCADE;
DROP TABLE IF EXISTS "students" CASCADE;
DROP TABLE IF EXISTS "teachers" CASCADE;
DROP TABLE IF EXISTS "companies" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- 2. CREATE ENUM TYPES IF NOT EXISTS
DO $$ BEGIN
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin', 'teacher', 'student');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."enum_users_status" AS ENUM('active', 'inactive');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."enum_students_internship_type" AS ENUM('THUC_TAP', 'DO_AN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE "public"."enum_scores_score_type" AS ENUM('TEACHER', 'COMPANY');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 3. CREATE USERS TABLE
CREATE TABLE "users" (
    "id" SERIAL PRIMARY KEY,
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "password" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(255) NOT NULL,
    "role" "public"."enum_users_role" NOT NULL DEFAULT 'student',
    "status" "public"."enum_users_status" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. CREATE COMPANIES TABLE
CREATE TABLE "companies" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) NOT NULL,
    "address" TEXT,
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "nguoi_tiep_nhan" VARCHAR(255),
    "notes" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. CREATE TEACHERS TABLE
CREATE TABLE "teachers" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER UNIQUE REFERENCES "users"("id") ON DELETE SET NULL,
    "teacher_code" VARCHAR(50) NOT NULL UNIQUE,
    "full_name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255),
    "department" VARCHAR(255),
    "phone" VARCHAR(20),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. CREATE STUDENTS TABLE
CREATE TABLE "students" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER UNIQUE REFERENCES "users"("id") ON DELETE SET NULL,
    "student_code" VARCHAR(50) NOT NULL UNIQUE,
    "ho_ten_lot" VARCHAR(200) NOT NULL DEFAULT '',
    "ten" VARCHAR(100) NOT NULL DEFAULT '',
    "class_name" VARCHAR(100),
    "major" VARCHAR(255),
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "batch" VARCHAR(20),
    "academic_status" VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    "internship_type" "public"."enum_students_internship_type" NOT NULL DEFAULT 'THUC_TAP',
    "company_id" INTEGER REFERENCES "companies"("id") ON DELETE SET NULL,
    "teacher_id" INTEGER REFERENCES "teachers"("id") ON DELETE SET NULL,
    "internship_status" VARCHAR(50) NOT NULL DEFAULT 'not_started',
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_students_batch ON "students"("batch");
CREATE INDEX idx_students_academic_status ON "students"("academic_status");
CREATE INDEX idx_students_internship_status ON "students"("internship_status");
CREATE INDEX idx_students_teacher_id ON "students"("teacher_id");

-- 7. CREATE INTERNSHIP ASSIGNMENTS TABLE
CREATE TABLE "internship_assignments" (
    "id" SERIAL PRIMARY KEY,
    "student_id" INTEGER NOT NULL REFERENCES "students"("id") ON DELETE CASCADE,
    "teacher_id" INTEGER NOT NULL REFERENCES "teachers"("id") ON DELETE CASCADE,
    "assigned_by" INTEGER NOT NULL REFERENCES "users"("id"),
    "assigned_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. CREATE WEEKLY REPORTS TABLE
CREATE TABLE "weekly_reports" (
    "id" SERIAL PRIMARY KEY,
    "student_id" INTEGER NOT NULL REFERENCES "students"("id") ON DELETE CASCADE,
    "week_number" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "submitted_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "file_path" VARCHAR(500),
    "status" VARCHAR(50) NOT NULL DEFAULT 'submitted',
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 9. CREATE COMMENTS TABLE
CREATE TABLE "comments" (
    "id" SERIAL PRIMARY KEY,
    "report_id" INTEGER NOT NULL REFERENCES "weekly_reports"("id") ON DELETE CASCADE,
    "teacher_id" INTEGER NOT NULL REFERENCES "teachers"("id") ON DELETE CASCADE,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 10. CREATE SCORES TABLE
CREATE TABLE "scores" (
    "id" SERIAL PRIMARY KEY,
    "student_id" INTEGER NOT NULL REFERENCES "students"("id") ON DELETE CASCADE,
    "teacher_id" INTEGER NOT NULL REFERENCES "teachers"("id") ON DELETE CASCADE,
    "score_type" "public"."enum_scores_score_type" NOT NULL DEFAULT 'TEACHER',
    "attendance_score" NUMERIC(4,2),
    "professional_score" NUMERIC(4,2),
    "average_score" NUMERIC(4,2),
    "notes" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 11. CREATE IMPORT LOGS TABLE
CREATE TABLE "import_logs" (
    "id" SERIAL PRIMARY KEY,
    "imported_by" INTEGER NOT NULL REFERENCES "users"("id"),
    "import_type" VARCHAR(50) NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "error_details" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 12. CREATE SUPERVISION REQUESTS TABLE
CREATE TABLE "supervision_requests" (
    "id" SERIAL PRIMARY KEY,
    "student_id" INTEGER NOT NULL REFERENCES "students"("id") ON DELETE CASCADE,
    "teacher_id" INTEGER NOT NULL REFERENCES "teachers"("id") ON DELETE CASCADE,
    "message" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "request_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "response_date" DATE,
    "response_note" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_supervision_requests_student_id ON "supervision_requests"("student_id");
CREATE INDEX idx_supervision_requests_teacher_id ON "supervision_requests"("teacher_id");

-- 13. CREATE NOTIFICATIONS TABLE
CREATE TABLE "notifications" (
    "id" SERIAL PRIMARY KEY,
    "user_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL DEFAULT 'general',
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "related_id" INTEGER,
    "related_type" VARCHAR(50),
    "created_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON "notifications"("user_id");

-- ====================================================================
-- SEED INITIAL DATA
-- ====================================================================

-- Users (Password: Admin@123 / Teacher@123 / Student@123)
INSERT INTO "users" ("id", "email", "password", "full_name", "role") VALUES
(1, 'admin@university.edu.vn', '$2a$10$bnd3Y6cLrv.JjjqWUbwyAuhfNujAh0uyGpoL47MFrjm2QYwIPA7bi', 'Quản trị viên', 'admin'),
(2, 'gvhd01@university.edu.vn', '$2a$10$EyHWsAUxb1WIHK9SzzJmS.KFiPTnysXZx6vMSrw1YZIM5aj9x/8m6', 'Nguyễn Văn Anh', 'teacher'),
(3, 'gvhd02@university.edu.vn', '$2a$10$EyHWsAUxb1WIHK9SzzJmS.KFiPTnysXZx6vMSrw1YZIM5aj9x/8m6', 'Trần Thị Bình', 'teacher'),
(4, 'gvhd03@university.edu.vn', '$2a$10$EyHWsAUxb1WIHK9SzzJmS.KFiPTnysXZx6vMSrw1YZIM5aj9x/8m6', 'Lê Minh Cường', 'teacher'),
(5, 'k21001@student.edu.vn', '$2a$10$zYQbWUUH22noDLlfJe9JBOkvh0ptsiSm7QGjWf3SlbFMDUuxQFtq6', 'Lê Văn Cường', 'student'),
(6, 'k21002@student.edu.vn', '$2a$10$zYQbWUUH22noDLlfJe9JBOkvh0ptsiSm7QGjWf3SlbFMDUuxQFtq6', 'Phạm Thị Dung', 'student'),
(7, 'k22001@student.edu.vn', '$2a$10$zYQbWUUH22noDLlfJe9JBOkvh0ptsiSm7QGjWf3SlbFMDUuxQFtq6', 'Hoàng Minh Đức', 'student'),
(8, 'k22002@student.edu.vn', '$2a$10$zYQbWUUH22noDLlfJe9JBOkvh0ptsiSm7QGjWf3SlbFMDUuxQFtq6', 'Ngô Thanh Hà', 'student'),
(9, 'k23001@student.edu.vn', '$2a$10$zYQbWUUH22noDLlfJe9JBOkvh0ptsiSm7QGjWf3SlbFMDUuxQFtq6', 'Đỗ Thị Giang', 'student'),
(10, 'k23002@student.edu.vn', '$2a$10$zYQbWUUH22noDLlfJe9JBOkvh0ptsiSm7QGjWf3SlbFMDUuxQFtq6', 'Vũ Hải Long', 'student'),
(11, 'k23003@student.edu.vn', '$2a$10$zYQbWUUH22noDLlfJe9JBOkvh0ptsiSm7QGjWf3SlbFMDUuxQFtq6', 'Trần Quốc Bảo', 'student'),
(12, 'k24001@student.edu.vn', '$2a$10$zYQbWUUH22noDLlfJe9JBOkvh0ptsiSm7QGjWf3SlbFMDUuxQFtq6', 'Nguyễn Thu Hương', 'student'),
(13, 'k24002@student.edu.vn', '$2a$10$zYQbWUUH22noDLlfJe9JBOkvh0ptsiSm7QGjWf3SlbFMDUuxQFtq6', 'Phan Văn Đạt', 'student'),
(14, 'k24003@student.edu.vn', '$2a$10$zYQbWUUH22noDLlfJe9JBOkvh0ptsiSm7QGjWf3SlbFMDUuxQFtq6', 'Lý Thị Mai', 'student'),
(15, 'k25001@student.edu.vn', '$2a$10$zYQbWUUH22noDLlfJe9JBOkvh0ptsiSm7QGjWf3SlbFMDUuxQFtq6', 'Bùi Đức Anh', 'student'),
(16, 'k25002@student.edu.vn', '$2a$10$zYQbWUUH22noDLlfJe9JBOkvh0ptsiSm7QGjWf3SlbFMDUuxQFtq6', 'Cao Thị Lan', 'student');

-- Companies
INSERT INTO "companies" ("id", "name", "address", "email", "phone", "nguoi_tiep_nhan", "notes") VALUES
(1, 'FPT Software', '17 Duy Tân, Cầu Giấy, Hà Nội', 'hr@fpt.com.vn', '0243 763 5000', 'Nguyễn Hồng Hà', 'Công ty phần mềm hàng đầu Việt Nam'),
(2, 'Viettel Digital', '1 Giang Văn Minh, Ba Đình, Hà Nội', 'hr@viettel.com.vn', '0243 600 5000', 'Trần Minh Đức', 'Tập đoàn viễn thông'),
(3, 'VNG Corporation', '182 Lê Đại Hành, Q.11, TP.HCM', 'hr@vng.com.vn', '0283 060 7777', 'Lê Thanh Hương', 'Công ty công nghệ giải trí'),
(4, 'Shopee Vietnam', '21 Trường Chinh, Tân Bình, TP.HCM', 'hr@shopee.vn', '0287 102 3456', 'Phạm Thu Hà', 'Thương mại điện tử');

-- Teachers
INSERT INTO "teachers" ("id", "user_id", "teacher_code", "full_name", "email", "department", "phone") VALUES
(1, 2, 'GV001', 'Nguyễn Văn Anh', 'gvhd01@university.edu.vn', 'Công nghệ thông tin', '0901234567'),
(2, 3, 'GV002', 'Trần Thị Bình', 'gvhd02@university.edu.vn', 'Khoa học máy tính', '0912345678'),
(3, 4, 'GV003', 'Lê Minh Cường', 'gvhd03@university.edu.vn', 'Hệ thống thông tin', '0923456789');

-- Students
INSERT INTO "students" ("id", "user_id", "student_code", "ho_ten_lot", "ten", "class_name", "major", "email", "batch", "academic_status", "internship_type", "company_id", "teacher_id", "internship_status") VALUES
(1, 5, 'K21001', 'Lê Văn', 'Cường', 'K21-CNTT', 'Công nghệ thông tin', 'k21001@student.edu.vn', 'K21', 'GRADUATED', 'THUC_TAP', 1, 1, 'completed'),
(2, 6, 'K21002', 'Phạm Thị', 'Dung', 'K21-CNTT', 'Công nghệ thông tin', 'k21002@student.edu.vn', 'K21', 'GRADUATED', 'THUC_TAP', 2, 1, 'completed'),
(3, 7, 'K22001', 'Hoàng Minh', 'Đức', 'K22-CNTT', 'Công nghệ thông tin', 'k22001@student.edu.vn', 'K22', 'ACTIVE', 'THUC_TAP', 3, 2, 'completed'),
(4, 8, 'K22002', 'Ngô Thanh', 'Hà', 'K22-CNTT', 'Công nghệ thông tin', 'k22002@student.edu.vn', 'K22', 'GRADUATED', 'THUC_TAP', 1, 2, 'completed'),
(5, 9, 'K23001', 'Đỗ Thị', 'Giang', 'K23-CNTT', 'Công nghệ thông tin', 'k23001@student.edu.vn', 'K23', 'ACTIVE', 'THUC_TAP', 2, 1, 'in_progress'),
(6, 10, 'K23002', 'Vũ Hải', 'Long', 'K23-CNTT', 'Công nghệ thông tin', 'k23002@student.edu.vn', 'K23', 'ACTIVE', 'DO_AN', 3, 3, 'in_progress'),
(7, 11, 'K23003', 'Trần Quốc', 'Bảo', 'K23-CNTT', 'Công nghệ thông tin', 'k23003@student.edu.vn', 'K23', 'ACTIVE', 'THUC_TAP', 4, 2, 'in_progress'),
(8, 12, 'K24001', 'Nguyễn Thu', 'Hương', 'K24-CNTT', 'Công nghệ thông tin', 'k24001@student.edu.vn', 'K24', 'ACTIVE', 'DO_AN', 1, 3, 'in_progress'),
(9, 13, 'K24002', 'Phan Văn', 'Đạt', 'K24-CNTT', 'Công nghệ thông tin', 'k24002@student.edu.vn', 'K24', 'ACTIVE', 'THUC_TAP', NULL, NULL, 'not_started'),
(10, 14, 'K24003', 'Lý Thị', 'Mai', 'K24-CNTT', 'Công nghệ thông tin', 'k24003@student.edu.vn', 'K24', 'ACTIVE', 'THUC_TAP', NULL, NULL, 'not_started'),
(11, 15, 'K25001', 'Bùi Đức', 'Anh', 'K25-CNTT', 'Công nghệ thông tin', 'k25001@student.edu.vn', 'K25', 'ACTIVE', 'THUC_TAP', NULL, NULL, 'not_started'),
(12, 16, 'K25002', 'Cao Thị', 'Lan', 'K25-CNTT', 'Công nghệ thông tin', 'k25002@student.edu.vn', 'K25', 'ACTIVE', 'THUC_TAP', NULL, NULL, 'not_started');

-- Supervision Requests
INSERT INTO "supervision_requests" ("student_id", "teacher_id", "message", "status", "request_date") VALUES
(9, 1, 'Em muốn được thầy hướng dẫn kỳ thực tập ạ.', 'PENDING', '2025-01-10'),
(10, 2, 'Em đang thực tập tại FPT, kính nhờ cô hướng dẫn.', 'PENDING', '2025-01-11'),
(11, 3, 'Thầy ơi em xin được thầy hướng dẫn đồ án.', 'APPROVED', '2025-01-05');

-- Notifications
INSERT INTO "notifications" ("user_id", "title", "message", "type", "is_read") VALUES
(2, 'Yêu cầu hướng dẫn mới', 'Sinh viên Phan Văn Đạt (K24002) đã gửi yêu cầu hướng dẫn thực tập.', 'supervision_request', false),
(3, 'Yêu cầu hướng dẫn mới', 'Sinh viên Lý Thị Mai (K24003) đã gửi yêu cầu hướng dẫn thực tập.', 'supervision_request', false),
(15, 'Yêu cầu hướng dẫn được chấp thuận', 'GV Lê Minh Cường đã chấp thuận yêu cầu hướng dẫn thực tập của bạn.', 'request_approved', false);

-- Adjust Sequences
SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));
SELECT setval('companies_id_seq', (SELECT MAX(id) FROM companies));
SELECT setval('teachers_id_seq', (SELECT MAX(id) FROM teachers));
SELECT setval('students_id_seq', (SELECT MAX(id) FROM students));
