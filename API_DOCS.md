# SIMS 4.0 API Documentation

## Authentication & Authorization
All API requests (except `/api/auth/login`) require a JWT token in the `Authorization` header:
`Authorization: Bearer <your_jwt_token>`

Role-based access control (RBAC) is enforced. Roles: `admin`, `teacher`, `student`.

---

## 1. Auth & Users
### `POST /api/auth/login`
- Body: `{ "email": "admin@university.edu.vn", "password": "password" }`
- Returns: User profile & JWT token.

---

## 2. Students
### `GET /api/students` (Admin, Teacher)
- Query params: `page`, `limit`, `search`, `batch`, `academic_status`, `internship_status`, `sort_by`, `sort_order`
- Returns: Paginated list of students.

### `GET /api/students/batches` (Admin)
- Returns: Array of available batches (e.g., `["K21", "K22", "K23"]`).

### `POST /api/students` (Admin)
- Creates a single student.
- Body: `{ "student_code": "...", "full_name": "...", "email": "...", "batch": "K24", "academic_status": "ACTIVE" }`

### `POST /api/students/import` (Admin)
- Form-Data: `file` (CSV/Excel).
- Returns: Details of successful inserts and line-by-line errors.

---

## 3. Teachers
### `GET /api/teachers/public` (Student, Admin, Teacher)
- Returns: Public list of all teachers with their current `student_count`. Used by students to request supervision.

### `GET /api/teachers` (Admin)
- Query params: `page`, `limit`, `search`
- Returns: Paginated list of teachers.

---

## 4. Supervision Requests (SIMS 4.0 New Feature)
### `POST /api/supervision-requests` (Student)
- Body: `{ "teacher_id": 1, "message": "Em xin đăng ký" }`
- Creates a `PENDING` request. Triggers a notification to the teacher.

### `GET /api/supervision-requests/student` (Student)
- Returns: History of requests made by the current student.

### `GET /api/supervision-requests/teacher` (Teacher)
- Query params: `status` (PENDING, APPROVED, REJECTED)
- Returns: Inbox of requests sent to the current teacher.

### `PATCH /api/supervision-requests/:id/approve` (Teacher)
- Body: `{ "response_note": "..." }`
- Approves the request, automatically updates `student.teacher_id`, and notifies the student.

### `PATCH /api/supervision-requests/:id/reject` (Teacher)
- Body: `{ "response_note": "..." }`
- Rejects the request and notifies the student.

---

## 5. Notifications
### `GET /api/supervision-requests/notifications` (All Roles)
- Returns: List of notifications and `unreadCount`.

### `PATCH /api/supervision-requests/notifications/read-all` (All Roles)
- Marks all notifications as read for the current user.

---

## 6. Statistics (Admin Dashboard)
### `GET /api/stats/overview`
- Returns: Total counts, request metrics, completion rate, and status breakdown.

### `GET /api/stats/by-batch`
- Returns: Student count grouped by `batch`.

### `GET /api/stats/reports`
- Returns: Report status breakdown and `weeklyTrend` (for Line charts).
