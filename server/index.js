import http from 'node:http';
import { Server } from 'socket.io';
import { env } from './config/env.js';
import { connectDatabase, closeDatabase } from './config/database.js';
import { createApp } from './app.js';
import { userFromToken } from './middleware/auth.js';
import { seedDatabase } from './seed/data.js';
import { startReminders } from './services/reminderService.js';
try {
  await connectDatabase();
  process.stdout.write(
    env.demo
      ? 'Temporary demo MongoDB connected; persistent Atlas verification is not complete.\n'
      : 'MongoDB connected successfully (configured persistent database).\n',
  );
  if (env.demo) await seedDatabase();
  const app = createApp();
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: env.client, credentials: true } });
  app.set('io', io);
  io.use(async (socket, next) => {
    const token = socket.handshake.headers.cookie
      ?.split(';')
      .map((v) => v.trim())
      .find((v) => v.startsWith('creatoros_session='))
      ?.slice(18);
    const user = await userFromToken(token);
    if (!user) return next(new Error('Unauthorized'));
    socket.user = user;
    socket.sessionToken = token;
    next();
  });
  io.on('connection', (socket) => socket.join(String(socket.user._id)));
  const reminders = startReminders(io);
  const sessionCheck = setInterval(async () => {
    for (const socket of io.sockets.sockets.values()) {
      if (!(await userFromToken(socket.sessionToken))) socket.disconnect(true);
    }
  }, 30000);
  sessionCheck.unref();
  server.listen(env.port, () =>
    process.stdout.write(
      `CreatorOS API ready at http://localhost:${env.port}${env.demo ? ' (temporary MongoDB demo)' : ''}\n`,
    ),
  );
  const shutdown = () => {
    clearInterval(reminders);
    clearInterval(sessionCheck);
    io.close();
    server.close(async () => {
      await closeDatabase();
      process.exit(0);
    });
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
} catch (error) {
  process.stderr.write(error.message + '\n');
  process.exit(1);
}