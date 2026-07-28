require('dotenv').config();
const {
  sequelize, User, Company, Teacher, Student,
  WeeklyReport, Score, InternshipAssignment, SupervisionRequest,
} = require('../models');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to PostgreSQL (sims_db)');

    // Sync all models — force:true recreates tables
    await sequelize.sync({ force: true });
    console.log('✅ Database synced (tables recreated)');

    // ─── Admin ───────────────────────────────────────────────────────────────
    const admin = await User.create({
      email: 'admin@university.edu.vn',
      password: 'Admin@123',
      full_name: 'Quản trị viên',
      role: 'admin',
    });
    console.log('✅ Admin created');

    // ─── Teachers ─────────────────────────────────────────────────────────────
    const teacherUser1 = await User.create({ email: 'gvhd01@university.edu.vn', password: 'Teacher@123', full_name: 'Nguyễn Văn Anh', role: 'teacher' });
    const teacherUser2 = await User.create({ email: 'gvhd02@university.edu.vn', password: 'Teacher@123', full_name: 'Trần Thị Bình', role: 'teacher' });
    const teacherUser3 = await User.create({ email: 'gvhd03@university.edu.vn', password: 'Teacher@123', full_name: 'Lê Minh Cường', role: 'teacher' });

    const teacher1 = await Teacher.create({ user_id: teacherUser1.id, teacher_code: 'GV001', full_name: 'Nguyễn Văn Anh', email: 'gvhd01@university.edu.vn', department: 'Công nghệ thông tin', phone: '0901234567' });
    const teacher2 = await Teacher.create({ user_id: teacherUser2.id, teacher_code: 'GV002', full_name: 'Trần Thị Bình', email: 'gvhd02@university.edu.vn', department: 'Khoa học máy tính', phone: '0912345678' });
    const teacher3 = await Teacher.create({ user_id: teacherUser3.id, teacher_code: 'GV003', full_name: 'Lê Minh Cường', email: 'gvhd03@university.edu.vn', department: 'Hệ thống thông tin', phone: '0923456789' });
    console.log('✅ Teachers created');

    // ─── Companies ───────────────────────────────────────────────────────────
    const company1 = await Company.create({ name: 'FPT Software', address: '17 Duy Tân, Cầu Giấy, Hà Nội', email: 'hr@fpt.com.vn', phone: '0243 763 5000', contact_person: 'Nguyễn Hồng Hà', notes: 'Công ty phần mềm hàng đầu Việt Nam' });
    const company2 = await Company.create({ name: 'Viettel Digital', address: '1 Giang Văn Minh, Ba Đình, Hà Nội', email: 'hr@viettel.com.vn', phone: '0243 600 5000', contact_person: 'Trần Minh Đức', notes: 'Tập đoàn viễn thông' });
    const company3 = await Company.create({ name: 'VNG Corporation', address: '182 Lê Đại Hành, Q.11, TP.HCM', email: 'hr@vng.com.vn', phone: '0283 060 7777', contact_person: 'Lê Thanh Hương', notes: 'Công ty công nghệ giải trí' });
    const company4 = await Company.create({ name: 'Shopee Vietnam', address: '21 Trường Chinh, Tân Bình, TP.HCM', email: 'hr@shopee.vn', phone: '0287 102 3456', contact_person: 'Phạm Thu Hà', notes: 'Thương mại điện tử' });
    console.log('✅ Companies created');

    // ─── Students (multiple batches) ─────────────────────────────────────────
    const studentData = [
      // K21 - Graduated
      { code: 'K21001', name: 'Lê Văn Cường', email: 'k21001@student.edu.vn', batch: 'K21', academic_status: 'GRADUATED', internship_status: 'completed', company: company1, teacher: teacher1 },
      { code: 'K21002', name: 'Phạm Thị Dung', email: 'k21002@student.edu.vn', batch: 'K21', academic_status: 'GRADUATED', internship_status: 'completed', company: company2, teacher: teacher1 },
      // K22 - Active/Graduated mix
      { code: 'K22001', name: 'Hoàng Minh Đức', email: 'k22001@student.edu.vn', batch: 'K22', academic_status: 'ACTIVE', internship_status: 'completed', company: company3, teacher: teacher2 },
      { code: 'K22002', name: 'Ngô Thanh Hà', email: 'k22002@student.edu.vn', batch: 'K22', academic_status: 'GRADUATED', internship_status: 'completed', company: company1, teacher: teacher2 },
      // K23 - Active in_progress
      { code: 'K23001', name: 'Đỗ Thị Giang', email: 'k23001@student.edu.vn', batch: 'K23', academic_status: 'ACTIVE', internship_status: 'in_progress', company: company2, teacher: teacher1 },
      { code: 'K23002', name: 'Vũ Hải Long', email: 'k23002@student.edu.vn', batch: 'K23', academic_status: 'ACTIVE', internship_status: 'in_progress', company: company3, teacher: teacher3 },
      { code: 'K23003', name: 'Trần Quốc Bảo', email: 'k23003@student.edu.vn', batch: 'K23', academic_status: 'ACTIVE', internship_status: 'in_progress', company: company4, teacher: teacher2 },
      // K24 - Mixed
      { code: 'K24001', name: 'Nguyễn Thu Hương', email: 'k24001@student.edu.vn', batch: 'K24', academic_status: 'ACTIVE', internship_status: 'in_progress', company: company1, teacher: teacher3 },
      { code: 'K24002', name: 'Phan Văn Đạt', email: 'k24002@student.edu.vn', batch: 'K24', academic_status: 'ACTIVE', internship_status: 'not_started', company: null, teacher: null },
      { code: 'K24003', name: 'Lý Thị Mai', email: 'k24003@student.edu.vn', batch: 'K24', academic_status: 'ACTIVE', internship_status: 'not_started', company: null, teacher: null },
      // K25 - New students
      { code: 'K25001', name: 'Bùi Đức Anh', email: 'k25001@student.edu.vn', batch: 'K25', academic_status: 'ACTIVE', internship_status: 'not_started', company: null, teacher: null },
      { code: 'K25002', name: 'Cao Thị Lan', email: 'k25002@student.edu.vn', batch: 'K25', academic_status: 'ACTIVE', internship_status: 'not_started', company: null, teacher: null },
    ];

    const createdStudents = [];
    for (const s of studentData) {
      const svUser = await User.create({ email: s.email, password: 'Student@123', full_name: s.name, role: 'student' });
      const student = await Student.create({
        user_id: svUser.id,
        student_code: s.code,
        full_name: s.name,
        email: s.email,
        batch: s.batch,
        academic_status: s.academic_status,
        class_name: `${s.batch}-CNTT`,
        major: 'Công nghệ thông tin',
        internship_type: s.code === 'K23002' || s.code === 'K24001' ? 'DO_AN' : 'THUC_TAP',
        company_id: s.company?.id || null,
        teacher_id: s.teacher?.id || null,
        internship_status: s.internship_status,
      });
      createdStudents.push({ student, user: svUser, data: s });
    }
    console.log('✅ Students created (K21–K25)');

    // ─── Internship Assignments ───────────────────────────────────────────────
    for (const { student, data } of createdStudents) {
      if (data.teacher) {
        await InternshipAssignment.create({
          student_id: student.id,
          teacher_id: data.teacher.id,
          assigned_by: admin.id,
          assigned_date: '2024-09-01',
          is_active: true,
        });
      }
    }
    console.log('✅ Assignments created');

    // ─── Weekly Reports (for in_progress students) ───────────────────────────
    const inProgressStudents = createdStudents.filter((s) => s.data.internship_status === 'in_progress');
    for (const { student } of inProgressStudents) {
      await WeeklyReport.create({ student_id: student.id, week_number: 1, content: 'Tuần 1: Làm quen môi trường công ty, cài đặt công cụ phát triển.', submitted_date: '2024-09-07', status: 'approved' });
      await WeeklyReport.create({ student_id: student.id, week_number: 2, content: 'Tuần 2: Bắt đầu tìm hiểu source code và tham gia sprint planning.', submitted_date: '2024-09-14', status: 'viewed' });
      await WeeklyReport.create({ student_id: student.id, week_number: 3, content: 'Tuần 3: Hoàn thành task được giao, fix bug trong module login.', submitted_date: '2024-09-21', status: 'submitted' });
    }
    console.log('✅ Weekly reports created');

    // ─── Scores (for completed students) ─────────────────────────────────────
    const completedStudents = createdStudents.filter((s) => s.data.internship_status === 'completed');
    for (const { student, data } of completedStudents) {
      if (data.teacher) {
        // Teacher score
        const teacherAtt = parseFloat((7 + Math.random() * 3).toFixed(1));
        const teacherProf = parseFloat((7 + Math.random() * 3).toFixed(1));
        await Score.create({
          student_id: student.id,
          teacher_id: data.teacher.id,
          score_type: 'TEACHER',
          attendance_score: teacherAtt,
          professional_score: teacherProf,
          average_score: parseFloat(((teacherAtt + teacherProf) / 2).toFixed(2)),
          notes: 'Sinh viên hoàn thành tốt kỳ thực tập dưới sự hướng dẫn của GVHD.',
        });

        // Company score
        const companyAtt = parseFloat((7 + Math.random() * 3).toFixed(1));
        const companyProf = parseFloat((7 + Math.random() * 3).toFixed(1));
        await Score.create({
          student_id: student.id,
          teacher_id: data.teacher.id,
          score_type: 'COMPANY',
          attendance_score: companyAtt,
          professional_score: companyProf,
          average_score: parseFloat(((companyAtt + companyProf) / 2).toFixed(2)),
          notes: 'Công ty đánh giá cao tinh thần và chuyên môn của sinh viên.',
        });
      }
    }
    console.log('✅ Scores created');

    // ─── Supervision Requests (K24/K25 students requesting teachers) ──────────
    const k24k25 = createdStudents.filter((s) => ['K24', 'K25'].includes(s.data.batch) && s.data.internship_status === 'not_started');
    if (k24k25.length >= 1) {
      await SupervisionRequest.create({ student_id: k24k25[0].student.id, teacher_id: teacher1.id, message: 'Em muốn được thầy hướng dẫn kỳ thực tập.', status: 'PENDING', request_date: '2025-01-10' });
    }
    if (k24k25.length >= 2) {
      await SupervisionRequest.create({ student_id: k24k25[1].student.id, teacher_id: teacher2.id, message: 'Em đang thực tập tại FPT, kính nhờ cô hướng dẫn.', status: 'PENDING', request_date: '2025-01-11' });
    }
    if (k24k25.length >= 3) {
      await SupervisionRequest.create({ student_id: k24k25[2].student.id, teacher_id: teacher3.id, message: 'Thầy ơi em xin được thầy hướng dẫn.', status: 'APPROVED', request_date: '2025-01-05', response_date: '2025-01-07', response_note: 'Thầy đồng ý, liên hệ thầy để được hướng dẫn.' });
    }
    console.log('✅ Supervision requests created');

    console.log('\n🎉 SIMS 4.0 Seed data completed successfully!');
    console.log('\n📋 Test accounts:');
    console.log('  Admin:   admin@university.edu.vn / Admin@123');
    console.log('  GVHD 1:  gvhd01@university.edu.vn / Teacher@123');
    console.log('  GVHD 2:  gvhd02@university.edu.vn / Teacher@123');
    console.log('  GVHD 3:  gvhd03@university.edu.vn / Teacher@123');
    console.log('  SV K23:  k23001@student.edu.vn / Student@123');
    console.log('  SV K24:  k24001@student.edu.vn / Student@123');
    console.log('  SV K25:  k25001@student.edu.vn / Student@123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
