require('dotenv').config();
const { Score, Student, Teacher } = require('./src/models');

async function test() {
  try {
    const scores = await Score.findAll({
      include: [
        { model: Student, as: 'student', attributes: ['id', 'student_code', 'full_name', 'internship_type'] }
      ]
    });
    console.log('--- ALL SCORES IN DB ---');
    console.log(JSON.stringify(scores, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

test();
