// LocalTunnel has been removed due to security advisories in its axios dependency.
// Please use the ngrok-based tunnel instead:
//   pnpm dev:tunnel   (starts dev server and ngrok automatically)
//   pnpm tunnel:ngrok (ngrok only)
console.error(
  "[tunnel] LocalTunnel is disabled. Use 'pnpm dev:tunnel' or 'pnpm tunnel:ngrok' instead."
);
process.exit(1);
