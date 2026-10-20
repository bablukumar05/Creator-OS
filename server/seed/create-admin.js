import { connectDatabase, closeDatabase } from '../config/database.js';
import { User } from '../models/User.js';
import { Profile } from '../models/resources.js';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { passwordSchema } from '../src/modules/auth/auth.validation.js';
const email = z.email().parse(process.env.ADMIN_EMAIL).toLowerCase();
const password = passwordSchema.parse(process.env.ADMIN_PASSWORD);
try {
  await connectDatabase();
  if (await User.exists({ email }))
    throw new Error('An account with this email already exists. No changes made.');
  const user = await User.create({
    name: process.env.ADMIN_NAME || 'Admin',
    email,
    password: await bcrypt.hash(password, 12),
    role: 'admin',
    emailVerified: true,
  });
  await Profile.create({ owner: user._id });
  process.stdout.write(
    'Administrator account created. Remove ADMIN_PASSWORD from the environment.\n',
  );
} finally {
  await closeDatabase();
}