require('dotenv').config();
const { connectDB, disconnectDB } = require('../config/mongodb');
const { User, Company, Teacher, Student, WeeklyReport, Score, InternshipAssignment } = require('../models');

async function seed() {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Company.deleteMany({}),
      Teacher.deleteMany({}),
      Student.deleteMany({}),
      WeeklyReport.deleteMany({}),
      Score.deleteMany({}),
      InternshipAssignment.deleteMany({}),
    ]);
    console.log('📋 Database cleared');

    // Create Admin
    const admin = await User.create({
      email: 'admin@university.edu.vn',
      password: 'Admin@123',
      full_name: 'Quản trị viên',
      role: 'admin',
    });
    console.log('✅ Admin created');

    // Create Teachers
    const teacherUser1 = await User.create({
      email: 'gvhd01@university.edu.vn',
      password: 'Teacher@123',
      full_name: 'Nguyễn Văn A',
      role: 'teacher',
    });
    const teacherUser2 = await User.create({
      email: 'gvhd02@university.edu.vn',
      password: 'Teacher@123',
      full_name: 'Trần Thị B',
      role: 'teacher',
    });

    const teacher1 = await Teacher.create({
      user_id: teacherUser1._id,
      teacher_code: 'GV001',
      full_name: 'Nguyễn Văn A',
      email: 'gvhd01@university.edu.vn',
      department: 'Công nghệ thông tin',
      phone: '0901234567',
    });
    const teacher2 = await Teacher.create({
      user_id: teacherUser2._id,
      teacher_code: 'GV002',
      full_name: 'Trần Thị B',
      email: 'gvhd02@university.edu.vn',
      department: 'Khoa học máy tính',
      phone: '0912345678',
    });
    console.log('✅ Teachers created');

    // Create Companies
    const company1 = await Company.create({
      name: 'FPT Software',
      address: '17 Duy Tân, Cầu Giấy, Hà Nội',
      email: 'hr@fpt.com.vn',
      phone: '0243 763 5000',
      contact_person: 'Nguyễn Hồng Hà',
      notes: 'Công ty phần mềm hàng đầu Việt Nam',
    });
    const company2 = await Company.create({
      name: 'Viettel Digital',
      address: '1 Giang Văn Minh, Ba Đình, Hà Nội',
      email: 'hr@viettel.com.vn',
      phone: '0243 600 5000',
      contact_person: 'Trần Minh Đức',
      notes: 'Tập đoàn viễn thông',
    });
    const company3 = await Company.create({
      name: 'VNG Corporation',
      address: '182 Lê Đại Hành, Q.11, TP.HCM',
      email: 'hr@vng.com.vn',
      phone: '0283 060 7777',
      contact_person: 'Lê Thanh Hương',
      notes: 'Công ty công nghệ giải trí',
    });
    console.log('✅ Companies created');

    // Create Students
    const svUser1 = await User.create({
      email: 'sv001@student.edu.vn',
      password: 'Student@123',
      full_name: 'Lê Văn C',
      role: 'student',
    });
    const svUser2 = await User.create({
      email: 'sv002@student.edu.vn',
      password: 'Student@123',
      full_name: 'Phạm Thị D',
      role: 'student',
    });
    const svUser3 = await User.create({
      email: 'sv003@student.edu.vn',
      password: 'Student@123',
      full_name: 'Hoàng Minh E',
      role: 'student',
    });
    const svUser4 = await User.create({
      email: 'sv004@student.edu.vn',
      password: 'Student@123',
      full_name: 'Ngô Thanh F',
      role: 'student',
    });
    const svUser5 = await User.create({
      email: 'sv005@student.edu.vn',
      password: 'Student@123',
      full_name: 'Đỗ Thị G',
      role: 'student',
    });

    const student1 = await Student.create({
      user_id: svUser1._id,
      student_code: 'SV001',
      full_name: 'Lê Văn C',
      class_name: 'CNTT-K20A',
      major: 'Công nghệ thông tin',
      email: 'sv001@student.edu.vn',
      phone: '0987654321',
      company_id: company1._id,
      teacher_id: teacher1._id,
      internship_status: 'in_progress',
    });
    const student2 = await Student.create({
      user_id: svUser2._id,
      student_code: 'SV002',
      full_name: 'Phạm Thị D',
      class_name: 'CNTT-K20A',
      major: 'Công nghệ thông tin',
      email: 'sv002@student.edu.vn',
      phone: '0976543210',
      company_id: company1._id,
      teacher_id: teacher1._id,
      internship_status: 'in_progress',
    });
    const student3 = await Student.create({
      user_id: svUser3._id,
      student_code: 'SV003',
      full_name: 'Hoàng Minh E',
      class_name: 'KHMT-K20B',
      major: 'Khoa học máy tính',
      email: 'sv003@student.edu.vn',
      phone: '0965432109',
      company_id: company2._id,
      teacher_id: teacher2._id,
      internship_status: 'in_progress',
    });
    const student4 = await Student.create({
      user_id: svUser4._id,
      student_code: 'SV004',
      full_name: 'Ngô Thanh F',
      class_name: 'KHMT-K20B',
      major: 'Khoa học máy tính',
      email: 'sv004@student.edu.vn',
      phone: '0954321098',
      company_id: company3._id,
      teacher_id: teacher2._id,
      internship_status: 'not_started',
    });
    const student5 = await Student.create({
      user_id: svUser5._id,
      student_code: 'SV005',
      full_name: 'Đỗ Thị G',
      class_name: 'CNTT-K20A',
      major: 'Công nghệ thông tin',
      email: 'sv005@student.edu.vn',
      phone: '0943210987',
      company_id: company2._id,
      teacher_id: teacher1._id,
      internship_status: 'in_progress',
    });
    console.log('✅ Students created');

    // Create Assignments
    await InternshipAssignment.create({
      student_id: student1._id,
      teacher_id: teacher1._id,
      assigned_by: admin._id,
      assigned_date: new Date('2024-09-01'),
      is_active: true,
    });
    await InternshipAssignment.create({
      student_id: student2._id,
      teacher_id: teacher1._id,
      assigned_by: admin._id,
      assigned_date: new Date('2024-09-01'),
      is_active: true,
    });
    await InternshipAssignment.create({
      student_id: student3._id,
      teacher_id: teacher2._id,
      assigned_by: admin._id,
      assigned_date: new Date('2024-09-01'),
      is_active: true,
    });
    await InternshipAssignment.create({
      student_id: student4._id,
      teacher_id: teacher2._id,
      assigned_by: admin._id,
      assigned_date: new Date('2024-09-01'),
      is_active: true,
    });
    await InternshipAssignment.create({
      student_id: student5._id,
      teacher_id: teacher1._id,
      assigned_by: admin._id,
      assigned_date: new Date('2024-09-01'),
      is_active: true,
    });
    console.log('✅ Assignments created');

    // Create Weekly Reports
    await WeeklyReport.create({
      student_id: student1._id,
      week_number: 1,
      content: 'Tuần 1: Tìm hiểu môi trường làm việc, cài đặt các công cụ phát triển. Làm quen với team và quy trình Agile/Scrum.',
      submitted_date: new Date('2024-09-07'),
      status: 'approved',
    });
    await WeeklyReport.create({
      student_id: student1._id,
      week_number: 2,
      content: 'Tuần 2: Bắt đầu tìm hiểu source code dự án, đọc tài liệu API. Hoàn thành bài tập về React components.',
      submitted_date: new Date('2024-09-14'),
      status: 'viewed',
    });
    await WeeklyReport.create({
      student_id: student2._id,
      week_number: 1,
      content: 'Tuần 1: Setup môi trường dev, cài đặt Docker, PostgreSQL. Tham gia meeting với team backend.',
      submitted_date: new Date('2024-09-08'),
      status: 'approved',
    });
    await WeeklyReport.create({
      student_id: student3._id,
      week_number: 1,
      content: 'Tuần 1: Giới thiệu công ty và văn hóa làm việc. Tìm hiểu các dự án đang triển khai.',
      submitted_date: new Date('2024-09-07'),
      status: 'needs_revision',
    });
    console.log('✅ Weekly reports created');

    // Create Scores
    await Score.create({
      student_id: student1._id,
      teacher_id: teacher1._id,
      progress_score: 8.5,
      content_score: 9.0,
      attitude_score: 8.0,
      total_score: 8.55,
      notes: 'Sinh viên tích cực, nắm bắt nhanh',
    });
    await Score.create({
      student_id: student2._id,
      teacher_id: teacher1._id,
      progress_score: 7.5,
      content_score: 8.0,
      attitude_score: 9.0,
      total_score: 8.15,
      notes: 'Cần cải thiện kỹ năng coding',
    });
    console.log('✅ Scores created');

    console.log('\n🎉 Seed data completed successfully!');
    console.log('\n📋 Test accounts:');
    console.log('Admin:   admin@university.edu.vn / Admin@123');
    console.log('GVHD 1:  gvhd01@university.edu.vn / Teacher@123');
    console.log('GVHD 2:  gvhd02@university.edu.vn / Teacher@123');
    console.log('SV 1:    sv001@student.edu.vn / Student@123');
    console.log('SV 2:    sv002@student.edu.vn / Student@123');

    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
}

seed();
