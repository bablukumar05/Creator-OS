import fs from 'node:fs';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { databaseError } from '../utils/databaseError.js';
const checks = [];
const add = (name, pass, required = true) =>
  checks.push({ name, status: pass ? 'PASS' : required ? 'FAIL' : 'NOT CONFIGURED' });
add(
  'server/.env exists (host environment variables can replace it)',
  fs.existsSync(new URL('../.env', import.meta.url)),
  false,
);
add('No accidental server/.env.txt file', !fs.existsSync(new URL('../.env.txt', import.meta.url)));
add(
  'Persistent MongoDB URI configured',
  typeof env.mongo === 'string' &&
    /^mongodb(?:\+srv)?:\/\/[^\s]+$/.test(env.mongo) &&
    !/[<>]|USERNAME|PASSWORD|cluster-name/.test(env.mongo),
);
add(
  'Persistent JWT_SECRET configured (32+ characters)',
  (process.env.JWT_SECRET || '').length >= 32,
);
add('Temporary demo disabled', !env.demo);
add(
  'Email provider',
  !!process.env.EMAIL_FROM &&
    !!(
      process.env.RESEND_API_KEY ||
      (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_APP_PASSWORD)
    ),
  false,
);
for (const [name, keys] of [
  ['Facebook OAuth', ['FACEBOOK_APP_ID', 'FACEBOOK_APP_SECRET', 'FACEBOOK_CALLBACK_URL']],
  ['Cloudinary', ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET']],
])
  add(
    name,
    keys.every((key) => !!process.env[key]),
    false,
  );
if (env.production) {
  add('Production frontend HTTPS origin', typeof env.client === 'string' && /^https:\/\/[^\s]+$/.test(env.client));
  add('Production backend HTTPS origin', typeof env.server === 'string' && /^https:\/\/[^\s]+$/.test(env.server));
}
for (const check of checks) console.log(`${check.status}: ${check.name}`);
if (process.argv.includes('--connect')) {
  if (
    checks.find((check) => check.name === 'Persistent MongoDB URI configured').status !== 'PASS'
  ) {
    console.log('FAIL: Save your actual MONGO_URI in server/.env before connection testing.');
  } else {
    try {
      await mongoose.connect(env.mongo, { serverSelectionTimeoutMS: 10000, autoIndex: false });
      await mongoose.connection.db.command({ ping: 1 });
      console.log('PASS: Persistent MongoDB connection and ping. No records were changed.');
    } catch (error) {
      checks.push({ status: 'FAIL' });
      console.log(`FAIL: ${databaseError(error)}`);
    } finally {
      await mongoose.disconnect();
    }
  }
}
if (checks.some((check) => check.status === 'FAIL')) process.exitCode = 1;