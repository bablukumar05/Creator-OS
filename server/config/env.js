import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';
import { validateRuntime } from './validate.js';

dotenv.config({
  path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env'),
  quiet: true,
});

const fallbackSecret = crypto.randomBytes(48).toString('hex');

export const env = {
  production: process.env.NODE_ENV === 'production',
  demo: process.env.DEMO_MODE === 'true',
  port: Number(process.env.PORT || 5000),
  mongo: process.env.MONGO_URI,
  get secret() {
    return process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? fallbackSecret : '');
  },
  client: process.env.CLIENT_URL || 'http://localhost:5173',
  server: process.env.SERVER_URL || 'http://localhost:5000',
};

validateRuntime(env);
env.client = new URL(env.client).origin;
env.server = new URL(env.server).origin;

export const cookieOptions = { httpOnly: true, secure: env.production, sameSite: env.production ? 'none' : 'lax', path: '/' };