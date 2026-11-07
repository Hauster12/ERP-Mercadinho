const path = require('path');
process.chdir(path.join(__dirname, '..'));
require('dotenv/config');
const net = require('net');
const { startPgliteServer } = require('./pglite-server.cjs');

function checkPortInUse(port) {
  return new Promise((resolve) => {
    const tester = net
      .createServer()
      .once('error', () => resolve(true))
      .once('listening', () => {
        tester.close(() => resolve(false));
      })
      .listen(port, '127.0.0.1');
  });
}

(async () => {
  const pgInUse = await checkPortInUse(5432);
  if (!pgInUse) {
    await startPgliteServer(5432);
  } else {
    console.log('[DB] Porta 5432 já em uso — conectando ao PostgreSQL existente.');
  }

  const { createApp } = require('../dist/src/main.js');
  const app = await createApp();
  const port = Number(process.env.PORT || 3000);
  await app.listen(port, '0.0.0.0');
  console.log(`[Backend] API NexusERP rodando em http://localhost:${port}/api`);
})().catch((err) => {
  console.error('Erro ao iniciar servidor:', err);
  process.exit(1);
});
