import fs from 'node:fs';
import crypto from 'node:crypto';
const target = new URL('../server/.env', import.meta.url);
if (fs.existsSync(target)) {
  console.log('server/.env already exists; left unchanged.');
} else {
  const template = fs.readFileSync(new URL('../server/.env.example', import.meta.url), 'utf8');
  fs.writeFileSync(
    target,
    template
      .replace(/^MONGO_URI=.*$/m, 'MONGO_URI=')
      .replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${crypto.randomBytes(48).toString('hex')}`),
    { flag: 'wx', mode: 0o600 },
  );
  console.log(
    'Created server/.env with a random JWT secret. Save your real Atlas URI in MONGO_URI; no database credentials were invented.',
  );
}
