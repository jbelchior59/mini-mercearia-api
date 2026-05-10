# Secure Mini E-commerce API

Mini e-commerce full-stack para mercearia/fruta, reforcado com praticas de AppSec alinhadas com OWASP Top 10.

## Stack

- Node.js, Express e TypeScript
- Prisma ORM com SQLite local
- JWT para autenticacao
- bcrypt para passwords
- HTML, CSS e JavaScript no frontend
- Helmet, CORS allowlist, express-validator, express-rate-limit e multer

## Funcionalidades

- Registo e login de utilizadores
- Roles `admin`, `staff` e `customer`
- Gestao de produtos por admin/staff
- Upload de imagens de produtos
- Favoritos por cliente
- Criacao e listagem de encomendas
- Cupoes com regras de validade, minimo e limite de uso
- Frontend simples para loja e painel admin

## Security Features

- Passwords guardadas com bcrypt
- JWT com secret obrigatorio em producao, expiracao curta, issuer e audience
- RBAC nas rotas administrativas
- CORS baseado em `CLIENT_ORIGIN`
- Helmet para headers de seguranca
- Rate limiting em login e registo
- Validacao de inputs com express-validator
- Middleware global de validacao sem stack traces
- Validacao de IDs locais em rotas com parametros
- Protecao contra mass assignment com allowlists em updates
- Upload seguro: MIME/extensao permitidos, limite 2MB e nomes aleatorios
- Mitigacao de XSS no frontend com escape de dados vindos da API/localStorage
- Atualizacao atomica de stock com condicao `stock >= qty`
- Atualizacao atomica de `usedCount` de cupoes
- Logs de seguranca em JSON sem passwords nem tokens
- Error handler global com respostas genericas em producao

## OWASP Top 10 Coverage

- A01 Broken Access Control: RBAC em rotas sensiveis e validacao de tokens.
- A02 Cryptographic Failures: bcrypt para passwords e JWT configurado com secret forte.
- A03 Injection: validacao de inputs, IDs locais e filtros controlados.
- A04 Insecure Design: threat model documentado e mitigacoes por fluxo critico.
- A05 Security Misconfiguration: Helmet, CORS allowlist e variaveis de ambiente.
- A06 Vulnerable Components: workflow com `npm audit --audit-level=moderate`.
- A07 Identification and Authentication Failures: rate limiting no login e JWT com expiracao curta.
- A08 Software and Data Integrity Failures: mass assignment bloqueado por allowlists.
- A09 Security Logging and Monitoring Failures: logs JSON para eventos sensiveis.
- A10 SSRF: a API nao faz fetch de URLs fornecidos por utilizadores; uploads sao ficheiros locais validados.

## How to Run

### With Docker

```bash
docker compose up --build
```

Depois abre `http://localhost:4000`.

O container aplica migrations automaticamente e faz seed apenas se a base SQLite estiver vazia. A base fica persistida num volume Docker (`sqlite-data`) e os uploads noutro (`uploads-data`).

Para parar:

```bash
docker compose down
```

Para apagar tambem a base local do volume:

```bash
docker compose down -v
```

### Without Docker

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run seed
npm run dev
```

A API e o frontend local ficam por defeito em `http://localhost:4000`.

Para validar build:

```bash
npm run build
```

## Environment Variables

```env
PORT=4000
DATABASE_URL="file:./dev.db"
JWT_SECRET=change-me-use-a-long-random-secret
JWT_EXPIRES_IN=1h
JWT_ISSUER=secure-mini-ecommerce-api
JWT_AUDIENCE=secure-mini-ecommerce-client
CLIENT_ORIGIN=http://localhost:4000
NODE_ENV=development
```

O SQLite fica em `prisma/dev.db` por causa do caminho relativo definido em `DATABASE_URL`.

No Docker, `DATABASE_URL` e definido como `file:/data/dev.db` para guardar a base num volume persistente.

## Future Improvements

- Refresh tokens com rotacao e revogacao
- Testes automatizados de seguranca para rate limit, RBAC, uploads e validacao
- Scanning real de imagens antes de publicar uploads
- CSP mais restritiva ajustada ao frontend
- Auditoria de dependencias e upgrade do multer para v2
- Transacoes Prisma mais abrangentes para rollback completo dos fluxos de encomenda
