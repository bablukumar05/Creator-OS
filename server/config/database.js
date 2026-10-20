import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { env } from './env.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { databaseError } from '../utils/databaseError.js';
let temporary;
export async function connectDatabase() {
  let uri = env.mongo;
  if (env.demo) {
    temporary = await MongoMemoryServer.create({
      binary: {
        downloadDir:
          process.env.MONGOMS_DOWNLOAD_DIR ||
          path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.cache/mongodb'),
      },
    });
    uri = temporary.getUri('creatoros_demo');
  }
  if (!uri)
    throw new Error(
      'MONGO_URI is missing. Run npm run setup:env, then save your real MongoDB URI in server/.env and run npm run db:check. npm run demo is temporary only.',
    );
  try {
    // 10s connection timeout before falling back to formatted error
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
  } catch (error) {
    throw new Error(databaseError(error));
  }
}
export async function closeDatabase() {
  await mongoose.disconnect();
  await temporary?.stop();
}