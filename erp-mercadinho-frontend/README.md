# ERP Mercadinho — Frontend

Aplicação React + TypeScript + Vite para o ERP e ponto de venda.

## Desenvolvimento

```powershell
npm ci
npm run dev
```

Configure `VITE_API_URL` se a API não estiver disponível no proxy padrão `/api`.

## PDV offline

- O catálogo completo é armazenado no IndexedDB depois de carregado online.
- O service worker mantém a interface carregada disponível para recargas sem internet em builds de produção.
- O PDV aceita vendas offline somente com um caixa já aberto e uma sessão previamente autenticada neste dispositivo.
- As vendas pendentes são sincronizadas automaticamente quando a conexão retorna; o identificador idempotente evita duplicidade em reenvios.
- Divergências de preço, estoque ou caixa ficam pendentes para revisão, e o fechamento do caixa é bloqueado até resolver a fila.
- O armazenamento é local ao navegador/dispositivo. Login e abertura de caixa continuam exigindo conexão.

## Testar o modo offline localmente

1. Inicie o backend de teste em um terminal PowerShell, usando um banco PGlite isolado do diretório de dados que já exista:

   ```powershell
   Set-Location .\erp-mercadinho-backend
   New-Item -ItemType Directory -Force "$env:LOCALAPPDATA\NexusERP" | Out-Null
   $env:JWT_SECRET = 'segredo-local-de-teste-com-mais-de-32-caracteres'
   $env:DATABASE_URL = 'postgresql://postgres:postgres@127.0.0.1:5432/postgres'
   $env:DIRECT_URL = $env:DATABASE_URL
   $env:PGLITE_DATA_DIR = "$env:LOCALAPPDATA\NexusERP\offline-test-db"
   $env:SEED_ADMIN_EMAIL = 'admin@mercadinho.local'
   $env:SEED_ADMIN_PASSWORD = 'teste12345'
   npm run build
   node scripts/start-with-db.cjs
   ```

   O PGlite persiste os dados nesse diretório entre reinicializações. Para um teste limpo, escolha outro caminho em `PGLITE_DATA_DIR`. Não use esses dados de exemplo em produção.

2. Em outro terminal, gere e sirva a build de produção, necessária para testar o service worker:

   ```powershell
   Set-Location .\erp-mercadinho-frontend
   npm run build
   npm run preview -- --host 127.0.0.1 --port 4173
   ```

3. Abra `http://127.0.0.1:4173`, entre online e abra um caixa se necessário. Para a base de demonstração, use `maria@mercadinho.local` / `123456` (Caixa 02) ou `admin@mercadinho.local` / `teste12345`.
4. Aguarde o catálogo aparecer. No Chrome/Edge, abra as ferramentas de desenvolvedor, guia **Network**, marque **Offline** e faça uma venda. A tela deve indicar que ela foi salva offline e o estoque local deve diminuir.
5. Ainda sem conexão, recarregue a página para verificar que sessão, interface, catálogo e fila foram preservados.
6. Desmarque **Offline**. Aguarde a sincronização automática; a venda deve sair da fila, ser registrada no servidor e aparecer como sincronizada. Não feche o caixa enquanto houver pendências.

Use o modo **Offline** das ferramentas do navegador, não desligue a rede do computador: assim a API local continua funcionando quando você reconectar o navegador. O teste usa uma base local isolada e não altera o banco online.
