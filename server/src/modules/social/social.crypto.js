import crypto from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const RAW_KEY = process.env.SOCIAL_ENCRYPTION_KEY || process.env.SESSION_SECRET || 'creatoros-master-aes-encryption-key-32b!';
const KEY = crypto.createHash('sha256').update(RAW_KEY).digest();

export function encryptToken(plainText) {
  if (!plainText) return { encrypted: '', iv: '', authTag: '' };
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return {
    encrypted,
    iv: iv.toString('hex'),
    authTag,
  };
}

export function decryptToken(encryptedHex, ivHex, authTagHex) {
  if (!encryptedHex || !ivHex || !authTagHex) return '';
  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, Buffer.from(ivHex, 'hex'));
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
    let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch {
    return '';
  }
}
