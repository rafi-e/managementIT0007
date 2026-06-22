const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('ALTER TABLE "User" ALTER COLUMN pn SET NOT NULL')
  .then(r => { console.log('Done', r.rowCount); pool.end(); })
  .catch(e => { console.error(e.message); pool.end(); });
