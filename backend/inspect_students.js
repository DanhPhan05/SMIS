require('dotenv').config();
const { Student, Teacher, User } = require('./src/models');

async function run() {
  try {
    const teachers = await Teacher.findAll();
    console.log('--- ALL TEACHERS ---');
    console.log(teachers.map(t => ({ id: t.id, name: t.full_name, email: t.email, user_id: t.user_id })));

    const students = await Student.findAll();
    console.log('--- ALL STUDENTS ---');
    console.log(students.map(s => ({
      id: s.id,
      code: s.student_code,
      name: s.full_name,
      teacher_id: s.teacher_id,
      internship_type: s.internship_type
    })));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
