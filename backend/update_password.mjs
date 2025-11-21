import bcryptjs from 'bcryptjs';
import pkg from 'pg';
const { Client } = pkg;

const password = 'Admin123';
const hash = await bcryptjs.hash(password, 10);

console.log('Generated hash:', hash);

const client = new Client({
  host: 'localhost',
  port: 5437,
  database: 'zirakbook_accounting',
  user: 'zirakbook_user',
  password: 'zirakbook_password'
});

await client.connect();
await client.query('UPDATE "User" SET password = $1 WHERE email = $2', [hash, 'admin@zirakbook.com']);
await client.end();

console.log('Password updated successfully');
