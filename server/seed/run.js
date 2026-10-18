import { env } from '../config/env.js';
import { connectDatabase, closeDatabase } from '../config/database.js';
import { User } from '../models/User.js';
import { models, Profile, Analytics, Activity } from '../models/resources.js';
import { seedDatabase } from './data.js';
import mongoose from 'mongoose';
import { assertSeedAllowed } from '../config/validate.js';
if (env.production) throw new Error('Development seed accounts cannot be created in production.');
try {
  await connectDatabase();
  assertSeedAllowed(env.production, mongoose.connection.name);
  if (process.argv.includes('--reset')) {
    const users = await User.find({ email: /@creatoros\.demo$/ }).select('_id');
    const ids = users.map((u) => u._id);
    await Promise.all(
      [...Object.values(models), Profile, Analytics, Activity].map((m) =>
        m.deleteMany({ owner: { $in: ids } }),
      ),
    );
    await User.deleteMany({ _id: { $in: ids } });
  }
  await seedDatabase();
  process.stdout.write('CreatorOS development data is ready.\n');
} finally {
  await closeDatabase();
}