require('dotenv').config({ path: './backend/.env' });
const { User } = require('./backend/src/models');
async function test() {
  try {
    const users = await User.findAll({ where: { role: 'admin' } });
    console.log(users.map(u => u.email));
  } catch (err) { console.error(err); }
}
test();
