const { Pool } = require('pg');

require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  const client = await pool.connect();
  try {
    const result = await client.query('SELECT id, name, email FROM "User" WHERE pn IS NULL');
    for (const row of result.rows) {
      let pn = row.name ? row.name.replace(/\s+/g, '').toLowerCase() : 'user' + row.id.slice(0, 6);
      // Check uniqueness
      const existing = await client.query('SELECT id FROM "User" WHERE pn = $1 AND id != $2', [pn, row.id]);
      let suffix = 1;
      while (existing.rows.length > 0) {
        pn = (row.name ? row.name.replace(/\s+/g, '').toLowerCase() : 'user') + suffix;
        const check = await client.query('SELECT id FROM "User" WHERE pn = $1 AND id != $2', [pn, row.id]);
        if (check.rows.length === 0) break;
        suffix++;
      }
      await client.query('UPDATE "User" SET pn = $1 WHERE id = $2', [pn, row.id]);
      console.log('Updated', row.email, '->', pn);
    }
    console.log('Done. Total users backfilled:', result.rowCount);
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
