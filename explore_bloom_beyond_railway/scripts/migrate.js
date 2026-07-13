require('dotenv').config();
const { initializeDatabase, closePool } = require('../src/db');
const { getJwtSecret } = require('../src/auth');

(async () => {
  try {
    getJwtSecret();
    await initializeDatabase();
    console.log('Database migration and content seed completed.');
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  } finally {
    await closePool();
  }
})();
