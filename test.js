async function test() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@university.edu.vn', password: 'Admin@123' })
    });
    const loginData = await loginRes.json();
    const token = loginData.token;

    const fs = require('fs');
    const blob = new Blob([fs.readFileSync('test.csv')], { type: 'text/csv' });
    const formData = new FormData();
    formData.append('file', blob, 'test.csv');

    const res = await fetch('http://localhost:5000/api/teachers/import', {
      method: 'POST',
      headers: { Authorization: 'Bearer ' + token },
      body: formData
    });
    const data = await res.json();
    console.log(data);
  } catch (err) {
    console.error(err);
  }
}
test();
