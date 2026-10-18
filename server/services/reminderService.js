import { models, Profile } from '../models/resources.js';
export function startReminders(io) {
  async function run() {
    try {
      const now = new Date(),
        tomorrow = new Date(Date.now() + 86400000);
      for (const [key, date, category, done] of [
        ['tasks', 'dueDate', 'Task deadline', ['Completed', 'Cancelled']],
        ['content', 'publishDate', 'Content publishing reminder', ['Published', 'Archived']],
        ['deals', 'deadline', 'Brand deal deadline', ['Completed', 'Cancelled']],
        ['campaigns', 'endDate', 'Campaign deadline', ['Completed', 'Cancelled']],
        ['invoices', 'dueDate', 'Payment due', ['Paid', 'Cancelled']],
      ]) {
        const records = await models[key]
          .find({ deletedAt: null, [date]: { $gte: now, $lte: tomorrow }, status: { $nin: done } })
          .limit(500)
          .lean();
        for (const record of records) {
          const profile = await Profile.findOne({ owner: record.owner }).lean();
          if (profile?.notifications === false) continue;
          const title = `Due soon: ${record.title}`;
          if (
            await models.notifications.exists({
              owner: record.owner,
              title,
              createdAt: { $gte: new Date(Date.now() - 86400000) },
            })
          )
            continue;
          const notification = await models.notifications.create({
            owner: record.owner,
            title,
            description: `${record.title} is due within 24 hours.`,
            category,
          });
          io.to(String(record.owner)).emit('notification', notification);
        }
      }
    } catch {
      process.stderr.write('Reminder job could not complete. It will retry.\n');
    }
  }
  const timer = setInterval(run, 60000);
  timer.unref();
  return timer;
}