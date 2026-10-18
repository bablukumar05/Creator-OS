export function validateRuntime(config) {
  if (!Number.isInteger(config.port) || config.port < 1 || config.port > 65535)
    throw new Error('PORT must be an integer between 1 and 65535.');
  if (!config.secret || (config.production && config.secret.length < 32))
    throw new Error('Set JWT_SECRET to at least 32 random characters.');
  if (config.production && config.demo)
    throw new Error('DEMO_MODE is not permitted in production.');
  for (const [name, value] of [
    ['CLIENT_URL', config.client],
    ['SERVER_URL', config.server],
  ]) {
    let url;
    try {
      url = new URL(value);
    } catch {
      throw new Error(`${name} must be a valid origin.`);
    }
    if (
      !['http:', 'https:'].includes(url.protocol) ||
      url.username ||
      url.password ||
      url.search ||
      url.hash ||
      url.pathname !== '/'
    )
      throw new Error(
        `${name} must be an HTTP(S) origin without credentials, a path, query or fragment.`,
      );
    if (config.production && url.protocol !== 'https:')
      throw new Error(`${name} must use HTTPS in production.`);
  }
}
export function assertSeedAllowed(production, databaseName) {
  if (production || /(?:^|[_-])prod(?:uction)?(?:$|[_-])/i.test(databaseName))
    throw new Error(
      'Development seed/reset is blocked for production. Use a separate creatoros_dev database.',
    );
}