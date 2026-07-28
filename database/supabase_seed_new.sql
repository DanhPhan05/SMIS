-- ====================================================================
-- SIMS - CHỈ TẠO 1 TÀI KHOẢN ADMIN
-- Các tài khoản GV và SV sẽ được Admin import qua CSV
-- Copy vào Supabase -> SQL Editor -> Run
-- ====================================================================

-- Xóa dữ liệu cũ (giữ nguyên cấu trúc bảng)
TRUNCATE "notifications" CASCADE;
TRUNCATE "supervision_requests" CASCADE;
TRUNCATE "import_logs" CASCADE;
TRUNCATE "scores" CASCADE;
TRUNCATE "comments" CASCADE;
TRUNCATE "weekly_reports" CASCADE;
TRUNCATE "internship_assignments" CASCADE;
TRUNCATE "students" CASCADE;
TRUNCATE "teachers" CASCADE;
TRUNCATE "companies" CASCADE;
TRUNCATE "users" CASCADE;

-- Tạo 1 tài khoản Admin duy nhất
-- Email: admin@huflit.edu.vn
-- Mật khẩu: Admin@2026
INSERT INTO "users" ("id", "email", "password", "full_name", "role") VALUES
(1, 'admin@huflit.edu.vn', '$2a$10$1MWG/FW2yUwrj4fwet3.IuaRKSJ.rPk7aa4AEtnfeadoTJ8WaAhQe', 'Admin HUFLIT', 'admin');

-- Reset sequence
SELECT setval('users_id_seq', 1);
