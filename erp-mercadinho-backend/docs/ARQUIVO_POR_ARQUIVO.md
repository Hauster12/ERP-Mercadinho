# Leitura arquivo por arquivo

| Arquivo | Função |
| --- | --- |
| README.md | Instalação, Neon, login, comandos e deploy |
| docs/ESCOPO.md | Funcionalidades, permissões, regras e limites |
| docs/ROTAS.md | Contrato HTTP completo |
| docs/INTEGRACAO_FRONT.md | Troca de mocks por API no React |
| docs/insomnia-postman.json | Coleção para importar no Insomnia |
| package.json/package-lock.json | Dependências e scripts com versões fixadas |
| tsconfig.json | Compilação TypeScript com decorators do Nest |
| .env.example | Modelo das variáveis sem credenciais reais |n
| prisma/schema.prisma | Modelo do banco, relações e tipos |
| prisma/migrations/migration_lock.toml | Banco alvo PostgreSQL |
| prisma/migrations/20261012090000_initial/migration.sql | Criação das tabelas, constraints e índice de caixa aberto |
| prisma/seed.ts | Administrador inicial, categoria e empresa |
| src/main.ts | Inicialização, CORS, validação e serialização |
| src/app.module.ts | Registro de controllers, serviços e guards |
| src/prisma.service.ts | Cliente PostgreSQL e transações com retry |
| src/auth.ts | JWT, login, guards e decorators de permissão |
| src/dtos.ts | Validação dos corpos e query strings |
| src/common.ts | Conversão de Decimal/datas e respostas de erro |
| src/rules.ts | Regras de cálculo, quantidade e pagamento |
| src/catalog.controller.ts | Categorias, produtos, fornecedores, clientes, usuários e configurações |
| src/stock.ts | Movimentações e ajuste por inventário |
| src/cash.ts | Caixa, operações, saldo físico e fechamento |
| src/sales.ts | Venda atômica, idempotência e cancelamento |
| src/purchases.ts | Compra, recebimento e cancelamento pendente |
| src/finance.controller.ts | Financeiro, conciliações e dashboard |
| src/health.controller.ts | Verificação do processo da API |
| src/*.spec.ts | Testes Jest das regras e integração |
| jest.config.cjs/jest.integration.config.cjs | Separação de testes unitários e testes com banco |
| frontend/api.ts | Cliente HTTP de referência para copiar no React |
| Dockerfile/docker-compose.yml | Imagem da API e PostgreSQL local |
| src/logger.ts | Mensagens de inicialização do Nest em português |


