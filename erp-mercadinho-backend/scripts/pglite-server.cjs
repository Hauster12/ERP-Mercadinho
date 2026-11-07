const net = require('net');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const { PGlite } = require('@electric-sql/pglite');

function createParamStatus(name, value) {
  const nameBuf = Buffer.from(name + '\0', 'utf8');
  const valBuf = Buffer.from(value + '\0', 'utf8');
  const len = 4 + nameBuf.length + valBuf.length;
  const buf = Buffer.alloc(1 + len);
  buf[0] = 0x53; // 'S'
  buf.writeInt32BE(len, 1);
  nameBuf.copy(buf, 5);
  valBuf.copy(buf, 5 + nameBuf.length);
  return buf;
}

function buildStartupResponse() {
  // AuthenticationOk ('R', 8, 0)
  const authOk = Buffer.from([0x52, 0x00, 0x00, 0x00, 0x08, 0x00, 0x00, 0x00, 0x00]);
  const params = Buffer.concat([
    createParamStatus('server_version', '16.3'),
    createParamStatus('server_encoding', 'UTF8'),
    createParamStatus('client_encoding', 'UTF8'),
    createParamStatus('DateStyle', 'ISO, MDY'),
    createParamStatus('TimeZone', 'UTC'),
    createParamStatus('integer_datetimes', 'on'),
    createParamStatus('standard_conforming_strings', 'on'),
  ]);
  // BackendKeyData ('K', 12, 1, 1)
  const keyData = Buffer.from([
    0x4b, 0x00, 0x00, 0x00, 0x0c,
    0x00, 0x00, 0x00, 0x01,
    0x00, 0x00, 0x00, 0x01,
  ]);
  // ReadyForQuery ('Z', 5, 'I')
  const ready = Buffer.from([0x5a, 0x00, 0x00, 0x00, 0x05, 0x49]);
  return Buffer.concat([authOk, params, keyData, ready]);
}

async function startPgliteServer(port = 5432) {
  const dataDir = path.join(__dirname, '../.pglite-data');
  const isNew = !fs.existsSync(dataDir);
  const db = new PGlite(dataDir);
  await db.waitReady;

  // Check if tables exist; if not, apply initial migration and seed
  const check = await db.query(
    "SELECT count(*)::int AS total FROM information_schema.tables WHERE table_schema='public'"
  );
  if (check.rows[0].total === 0) {
    console.log('[PGlite] Aplicando schema inicial do banco de dados...');
    const sqlPath = path.join(
      __dirname,
      '../prisma/migrations/20261012090000_initial/migration.sql'
    );
    await db.exec(fs.readFileSync(sqlPath, 'utf8'));
  }

  // Ensure seed users, categories, products exist
  const adminEmail = (process.env.SEED_ADMIN_EMAIL || 'admin@mercadinho.local').trim().toLowerCase();
  const adminPass = process.env.SEED_ADMIN_PASSWORD || 'senhaforte123';
  const adminHash = await bcrypt.hash(adminPass, 10);
  const opHash = await bcrypt.hash('123456', 10);

  await db.query(
    `INSERT INTO usuarios (id, nome, email, "senhaHash", perfil, ativo, "atualizadoEm")
     VALUES ($1, $2, $3, $4, 'ADMIN', true, now())
     ON CONFLICT (email) DO UPDATE SET "senhaHash" = EXCLUDED."senhaHash", ativo = true`,
    ['00000000-0000-4000-8000-000000000001', 'Administrador', adminEmail, adminHash]
  );

  await db.query(
    `INSERT INTO usuarios (id, nome, email, "senhaHash", perfil, ativo, "atualizadoEm")
     VALUES ($1, $2, $3, $4, 'FUNCIONARIO', true, now())
     ON CONFLICT (email) DO NOTHING`,
    ['00000000-0000-4000-8000-000000000002', 'João Operador (Caixa 01)', 'joao@mercadinho.local', opHash]
  );

  await db.query(
    `INSERT INTO usuarios (id, nome, email, "senhaHash", perfil, ativo, "atualizadoEm")
     VALUES ($1, $2, $3, $4, 'FUNCIONARIO', true, now())
     ON CONFLICT (email) DO NOTHING`,
    ['00000000-0000-4000-8000-000000000003', 'Maria Operadora (Caixa 02)', 'maria@mercadinho.local', opHash]
  );

  await db.query(
    `INSERT INTO categorias (id, nome, descricao, ativo, "atualizadoEm")
     VALUES ($1, 'Mercearia', 'Alimentos e itens gerais', true, now())
     ON CONFLICT (nome) DO NOTHING`,
    ['00000000-0000-4000-8000-000000000010']
  );

  await db.query(
    `INSERT INTO categorias (id, nome, descricao, ativo, "atualizadoEm")
     VALUES ($1, 'Bebidas', 'Refrigerantes, sucos e águas', true, now())
     ON CONFLICT (nome) DO NOTHING`,
    ['00000000-0000-4000-8000-000000000011']
  );

  await db.query(
    `INSERT INTO configuracao_empresa (id, "razaoSocial", "nomeFantasia", cnpj, telefone, cidade, "atualizadoEm")
     VALUES (1, 'Mercadinho Nexus LTDA', 'Nexus Mercadinho', '12345678000199', '(11) 99999-0000', 'São Paulo - SP', now())
     ON CONFLICT (id) DO NOTHING`
  );

  // Sample products if none exist
  const prodCount = await db.query('SELECT count(*)::int AS total FROM produtos');
  if (prodCount.rows[0].total === 0) {
    await db.query(
      `INSERT INTO produtos (id, "categoriaId", nome, sku, "codigoBarras", unidade, "precoCusto", "precoVenda", "estoqueAtual", "estoqueMinimo", ativo, "atualizadoEm")
       VALUES
       ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000010', 'Arroz Tipo 1 5kg', 'ARR-5KG', '7891000100101', 'UN', 18.50, 26.90, 45, 10, true, now()),
       ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000010', 'Feijão Carioca 1kg', 'FEI-1KG', '7891000100102', 'UN', 5.20, 8.90, 60, 15, true, now()),
       ('00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000011', 'Refrigerante Cola 2L', 'REF-2L', '7891000100103', 'UN', 6.00, 10.50, 35, 12, true, now()),
       ('00000000-0000-4000-8000-000000000104', '00000000-0000-4000-8000-000000000010', 'Café Torrado e Moído 500g', 'CAF-500G', '7891000100104', 'UN', 12.00, 19.90, 25, 8, true, now())`
    );
  }

  // Ensure Maria Operadora has Caixa 02 open with sample sales flow if no open register exists for her
  const mariaCaixa = await db.query(
    `SELECT id FROM caixas WHERE "usuarioId" = '00000000-0000-4000-8000-000000000003' AND status = 'ABERTO'`
  );
  if (mariaCaixa.rows.length === 0) {
    const cxId = '00000000-0000-4000-8000-000000000202';
    await db.query(
      `INSERT INTO caixas (id, "usuarioId", "valorInicial", status, "abertoEm")
       VALUES ($1, '00000000-0000-4000-8000-000000000003', 100.00, 'ABERTO', now() - interval '2 hours')
       ON CONFLICT (id) DO NOTHING`,
      [cxId]
    );
    await db.query(
      `INSERT INTO operacoes_caixa (id, "caixaId", "usuarioId", tipo, valor, observacao)
       VALUES ('00000000-0000-4000-8000-000000000302', $1, '00000000-0000-4000-8000-000000000003', 'ABERTURA', 100.00, '{"numeroCaixa":2}')
       ON CONFLICT (id) DO NOTHING`,
      [cxId]
    );
    const vendaId = '00000000-0000-4000-8000-000000000401';
    await db.query(
      `INSERT INTO vendas (id, "caixaId", "usuarioId", subtotal, desconto, "valorTotal", status, "chaveIdempotencia", "atualizadoEm")
       VALUES ($1, $2, '00000000-0000-4000-8000-000000000003', 46.30, 0, 46.30, 'CONCLUIDA', 'seed-venda-caixa02-1', now())
       ON CONFLICT (id) DO NOTHING`,
      [vendaId, cxId]
    );
    await db.query(
      `INSERT INTO itens_venda (id, "vendaId", "produtoId", "produtoNome", "produtoSku", quantidade, "precoUnitario", "custoUnitario", subtotal)
       VALUES
       ('00000000-0000-4000-8000-000000000501', $1, '00000000-0000-4000-8000-000000000101', 'Arroz Tipo 1 5kg', 'ARR-5KG', 1, 26.90, 18.50, 26.90),
       ('00000000-0000-4000-8000-000000000502', $1, '00000000-0000-4000-8000-000000000103', 'Refrigerante Cola 2L', 'REF-2L', 1, 10.50, 6.00, 10.50),
       ('00000000-0000-4000-8000-000000000503', $1, '00000000-0000-4000-8000-000000000102', 'Feijão Carioca 1kg', 'FEI-1KG', 1, 8.90, 5.20, 8.90)
       ON CONFLICT (id) DO NOTHING`,
      [vendaId]
    );
    await db.query(
      `INSERT INTO pagamentos (id, "vendaId", forma, valor, confirmado)
       VALUES
       ('00000000-0000-4000-8000-000000000601', $1, 'DINHEIRO', 26.30, true),
       ('00000000-0000-4000-8000-000000000602', $1, 'PIX', 20.00, true)
       ON CONFLICT (id) DO NOTHING`,
      [vendaId]
    );
  }

  let queue = Promise.resolve();

  const server = net.createServer((socket) => {
    socket.on('data', (chunk) => {
      queue = queue.then(async () => {
        try {
          // SSLRequest (8 bytes, code 80877103) or GSSENCRequest (80877104)
          if (
            chunk.length === 8 &&
            chunk.readInt32BE(0) === 8 &&
            (chunk.readInt32BE(4) === 80877103 || chunk.readInt32BE(4) === 80877104)
          ) {
            if (!socket.destroyed) socket.write(Buffer.from('N'));
            return;
          }

          // CancelRequest (16 bytes, code 80877102)
          if (
            chunk.length === 16 &&
            chunk.readInt32BE(0) === 16 &&
            chunk.readInt32BE(4) === 80877102
          ) {
            socket.end();
            return;
          }

          // Terminate ('X')
          if (chunk.length === 5 && chunk[0] === 0x58) {
            socket.end();
            return;
          }

          const reply = await db.execProtocolRaw(new Uint8Array(chunk));
          if (!socket.destroyed && reply && reply.byteLength > 0) {
            socket.write(Buffer.from(reply));
          }
        } catch (err) {
          console.error('[PGlite Protocol Error]', err);
        }
      });
    });

    socket.on('error', () => {});
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', resolve);
  });

  console.log(`[PGlite] Servidor PostgreSQL local ouvindo em 127.0.0.1:${port}`);
  return { server, db };
}

if (require.main === module) {
  startPgliteServer(Number(process.env.PG_PORT || 5432)).catch((err) => {
    console.error('Erro ao iniciar PGlite Server:', err);
    process.exit(1);
  });
}

module.exports = { startPgliteServer };
