// Ensure consistent timezone and deterministic timers
process.env.TZ = 'UTC';

// If you must load .env.test, rely on dotenv/config in setupFiles
// You can also put any custom matchers or global hooks here.

// Example: fail tests on unhandled rejections
process.on('unhandledRejection', (reason) => {
  // Surface as test failure
  // eslint-disable-next-line no-console
  console.error('UnhandledRejection:', reason);
  throw reason;
});
