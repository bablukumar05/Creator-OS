import { env } from '../config/env.js';
import { connectDatabase, closeDatabase } from '../config/database.js';
import { auditData } from '../services/dataAuditService.js';
if (env.demo) throw new Error('Use a persistent development database for seed verification.');
try {
  await connectDatabase();
  const { counts, invalidLinks: invalid, contextMismatches } = await auditData();
  for (const [key, count] of Object.entries(counts)) console.log(`${key}: ${count} records`);
  console.log(
    `${contextMismatches ? 'REVIEW' : 'PASS'}: ${contextMismatches} brand/campaign context mismatches.`,
  );
  console.log(
    `${invalid ? 'FAIL' : 'PASS'}: ${invalid} missing or cross-owner linked records. Read-only check; no records changed.`,
  );
  if (invalid) process.exitCode = 1;
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  await closeDatabase();
}