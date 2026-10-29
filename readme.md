# Atualizações recentes

Este arquivo registra as alterações realizadas nesta etapa de trabalho.

## Responsividade e uso em telas pequenas

- A navegação lateral ganhou modo compacto em telas médias, gaveta em celulares, transições mais suaves e preferência de expansão/retração salva no navegador. O controle de expandir/recolher no computador fica na própria barra lateral; o cabeçalho mantém o botão para abrir a gaveta no celular.
- A tela de cadastros adapta as abas e ações para toque e apresenta clientes e categorias em cartões no celular, evitando que informações e controles fiquem fora da tela.
- No PDV, os filtros de categoria quebram em várias linhas e o seletor de cliente ocupa a largura disponível em telas estreitas.
- O histórico de vendas tem cartões em dispositivos móveis; tabelas mantêm rolagem horizontal e indicação visual para deslizar.
- Modais se adaptam a telas pequenas como painéis inferiores, com ações acessíveis e alvos de toque maiores.
- O Financeiro, o carrinho e as ações do PDV, os formulários e os controles de navegação foram ajustados para caber melhor em celulares e tablets.

## Avisos após finalizar uma venda

- As notificações foram posicionadas no canto superior direito, em uma largura que se adapta ao celular, para não cobrir as ações **Nova Venda** e **Imprimir Cupom**.

## Acesso pelo celular na rede local

- O cliente da API usa o caminho relativo `/api`; assim, no celular, as chamadas seguem para o mesmo endereço de rede usado para abrir o site.
- O servidor de desenvolvimento do Vite escuta na rede local e encaminha `/api` para `http://127.0.0.1:3000`.
- O indicador de conexão testa `/api/health` no mesmo host do frontend, sem tentar acessar o `localhost` do celular.
- As requisições da API têm tempo limite de 10 segundos e erros de conexão apresentam uma mensagem mais clara.
- A inicialização da sessão libera a tela de carregamento mesmo se a verificação de autenticação falhar.
- Foi criada no Windows uma regra de entrada chamada **NexusERP celular - rede local**: TCP `5173`, somente no perfil **Private** e para `LocalSubnet`. A porta `3000` não foi liberada diretamente.

### Endereço de acesso atual

Com o computador e o celular conectados à mesma rede local, abra:

```text
http://192.168.0.248:5173
```

O endereço `192.168.0.248` é o IP atual do computador e pode mudar. Para verificá-lo no Windows:

```powershell
Get-NetIPAddress -AddressFamily IPv4
```

Use o IPv4 da interface conectada à mesma rede Wi-Fi do celular. O computador precisa permanecer ligado, com o frontend e a API em execução.

### HTTP e conexão segura

O ambiente local está configurado para **HTTP**, não HTTPS. Digite o endereço começando explicitamente com `http://`. Se o navegador transformar o endereço em `https://`, a conexão segura falhará porque não há certificado HTTPS configurado para esse IP local. Acesso HTTP não criptografa os dados; utilize somente uma rede confiável e para testes.

Para verificar a conectividade da API pelo celular, abra:

```text
http://192.168.0.248:5173/api/health
```

A resposta esperada é:

```json
{"status":"ok"}
```

Se o endereço de saúde responder, mas o ERP continuar preso em uma tela antiga, recarregue a página ou feche e abra novamente o navegador. Se não responder, confira se o celular não está em uma rede Wi-Fi de convidados e se o IP do computador continua o mesmo.

## Validação realizada

- `npm run build` do frontend passou após as alterações.
- Os endpoints do site e `/api/health` responderam com HTTP 200 no endereço de rede local do computador.
- A interface foi conferida em largura móvel de 390 px; a tela principal saiu da inicialização e carregou o PDV.
- Uma venda real não foi executada durante a validação.
