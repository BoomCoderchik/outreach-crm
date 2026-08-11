import { createServiceServer, resolveServiceHost } from './server.js';

const version = process.env.npm_package_version ?? '0.1.0';
const host = resolveServiceHost(process.env.HOST, process.env.UNSAFE_ALLOW_NETWORK);
const port = Number(process.env.PORT ?? 8787);

const server = createServiceServer(version);

server.listen(port, host, () => {
  console.log(`Outreach CRM local service listening on http://${host}:${port}`);
});
