const { hashPassword, verifyPassword, createToken, verifyToken } = require('./src/lib/auth.js');
const db = require('./src/lib/db.js');

async function test() {
  try {
    const user = { id: 1, email: 'admin@paroquia.com', role: 'ADMIN', name: 'Admin Test' };
    const token = await createToken(user);
    console.log('Token created:', token);
    const verified = await verifyToken(token);
    console.log('Token verified:', verified);
  } catch (err) {
    console.error('Error in JWT part:', err);
  }
}
test();
