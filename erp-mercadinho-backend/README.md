# ERP Mercadinho — API

Backend para gerenciamento de produtos, estoque, vendas, caixa, compras e financeiro.

## Tecnologias

- Node.js + TypeScript + NestJS
- Prisma + PostgreSQL no Neon
- JWT + bcrypt
- Jest para testes automatizados
- Insomnia para testes manuais

## Funcionalidades

- Login e permissões de administrador e funcionário.
- Cadastro de produtos, categorias, clientes, fornecedores e usuários.
- Entradas, saídas e ajustes de estoque.
- Abertura e fechamento de caixa, sangrias e reforços.
- Vendas com pagamentos divididos e cancelamento.
- Pedidos de compra e recebimento de mercadorias.
- Controle financeiro e dashboard.

Os pagamentos são registros internos e os comprovantes não possuem valor fiscal.

## Instalação

Na pasta do projeto:

```powershell
npm ci
```

Copie `.env.example` para `.env` e configure a conexão com o banco, o segredo JWT, a origem do frontend e as credenciais do administrador. Não envie o `.env` ao GitHub.

## Preparar o banco

Execute um comando por vez:

```powershell
npm run prisma:generate
npm run db:migrate
npm run db:seed
```

## Iniciar a API

```powershell
npm run start:dev
```

Endereço: http://localhost:3000/api

Para verificar se a API está funcionando, acesse `GET /api/health`.

### Teste local com PGlite

O script `scripts/start-with-db.cjs` inicia um PostgreSQL local PGlite para desenvolvimento. Para manter os dados de teste separados de qualquer banco local existente, defina `PGLITE_DATA_DIR` antes de iniciar. Por exemplo, no PowerShell:

```powershell
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

O PGlite mantém o banco no diretório indicado. Escolha um caminho diferente para iniciar uma base de teste vazia. Credenciais de exemplo são apenas para desenvolvimento e não devem ser usadas em produção.

## Testes automatizados

Para executar todos os testes unitários com Jest:

```powershell
npm test
```

Para executar somente os testes de autenticação:

```powershell
npm test -- auth.spec.ts
```

Para verificar as migrações e restrições SQL em um banco temporário:

```powershell
npm run test:sql
```

Esses testes não alteram o banco Neon da aplicação.

## Testes manuais

Importe `docs/insomnia-postman.json` no Insomnia.

Faça login em `POST /api/auth/login` e utilize o token retornado nas demais requisições:

```text
Authorization: Bearer TOKEN
```

Substitua as variáveis de IDs pelos valores retornados pela API.

## Documentação

- [Escopo](docs/ESCOPO.md)
- [Rotas da API](docs/ROTAS.md)
- [Integração com o frontend](docs/INTEGRACAO_FRONT.md)
- [Estrutura de arquivos](docs/ARQUIVO_POR_ARQUIVO.md)