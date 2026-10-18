import crypto from 'node:crypto';
import { User } from '../models/User.js';
import { env } from '../config/env.js';
import { ApiError } from '../utils/http.js';
import { sendOtpEmail } from './emailService.js';
export const hashToken = (value) =>
  crypto.createHmac('sha256', env.secret).update(value).digest('hex');
export const generateOtp = () => crypto.randomInt(100000, 1000000).toString();
export async function issueOtp(user, purpose) {
  const code = generateOtp();
  const now = new Date();
  const reservation = await User.findOneAndUpdate(
    {
      _id: user._id,
      $or: [
        { [`${purpose}.sentAt`]: { $lt: new Date(Date.now() - 60000) } },
        { [`${purpose}.sentAt`]: { $exists: false } },
      ],
    },
    {
      $set: {
        [purpose]: {
          hash: hashToken(code),
          expires: new Date(Date.now() + 600000),
          sentAt: now,
          attempts: 0,
        },
      },
    },
    { new: true },
  );
  if (!reservation)
    throw new ApiError(429, 'Please wait 60 seconds before requesting another code.');
  try {
    await sendOtpEmail(user.email, code, purpose);
  } catch (error) {
    await User.updateOne(
      { _id: user._id, [`${purpose}.hash`]: hashToken(code) },
      { $unset: { [purpose]: 1 } },
    );
    throw error;
  }
}
export async function consumeOtp(email, code, purpose) {
  const user = await User.findOneAndUpdate(
    { email, [`${purpose}.expires`]: { $gt: new Date() }, [`${purpose}.attempts`]: { $lt: 5 } },
    { $inc: { [`${purpose}.attempts`]: 1 } },
    { new: true },
  ).select(`+${purpose}`);
  if (!user) throw new ApiError(400, 'Code expired or too many attempts. Request a new code.');
  if (user[purpose].hash !== hashToken(code)) throw new ApiError(400, 'Invalid verification code.');
  const consumed = await User.findOneAndUpdate(
    { _id: user._id, [`${purpose}.hash`]: hashToken(code) },
    { $unset: { [purpose]: 1 } },
    { new: true },
  );
  if (!consumed) throw new ApiError(400, 'This code has already been used.');
  return consumed;
}