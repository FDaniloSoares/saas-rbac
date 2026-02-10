# SaaS RBAC

Sistema de autenticação e autorização baseado em RBAC (Role-Based Access Control) para aplicações SaaS multi-tenant, construído com Node.js, TypeScript e CASL.

## Sobre o Projeto

Este projeto implementa um sistema completo de controle de acesso baseado em funções (RBAC) para aplicações SaaS, permitindo gerenciar permissões granulares de usuários em organizações, projetos e recursos. O sistema utiliza CASL para definição de políticas de autorização e Prisma para gerenciamento do banco de dados PostgreSQL.

## Tecnologias

### Core
- **Node.js** (>=18) - Runtime JavaScript
- **TypeScript** - Linguagem tipada
- **pnpm** (9.0.0) - Gerenciador de pacotes
- **Turborepo** - Build system para monorepos

### Backend (API)
- **Fastify** - Framework web de alta performance
- **Zod** - Validação de schemas TypeScript-first
- **fastify-type-provider-zod** - Integração Fastify + Zod
- **Prisma** - ORM para PostgreSQL
- **PostgreSQL** - Banco de dados relacional

### Autorização
- **CASL** - Framework de autorização isomórfico
- **@saas/auth** - Pacote customizado de RBAC

### Ferramentas
- **ESLint** - Linter JavaScript/TypeScript
- **Prettier** - Formatador de código
- **tsx** - TypeScript executor
- **Docker** - Containerização (PostgreSQL)

## Estrutura do Projeto

Este é um monorepo organizado com a seguinte estrutura:

```
saas-rbac/
├── apps/
│   └── api/                    # API REST com Fastify
│       ├── src/
│       │   └── http/
│       │       ├── server.ts   # Servidor Fastify
│       │       └── routes/     # Rotas da API
│       └── prisma/
│           └── schema.prisma   # Schema do banco de dados
├── packages/
│   └── auth/                   # Sistema RBAC com CASL
│       └── src/
│           ├── index.ts        # Definição de abilities
│           ├── permissions.ts  # Permissões por role
│           ├── roles.ts        # Definição de roles
│           ├── models/         # Modelos de dados
│           └── subjects/       # Subjects do CASL
└── config/                     # Configurações compartilhadas
    ├── eslint-config/          # Configuração ESLint
    ├── prettier/               # Configuração Prettier
    └── typescript-config/      # Configuração TypeScript
```

## Sistema de Roles e Permissões

### Roles Disponíveis

#### ADMIN
- Acesso total a todos os recursos
- Pode transferir propriedade da organização (apenas o owner)
- Pode atualizar configurações da organização (apenas o owner)

#### MEMBER
- Visualizar usuários
- Criar e visualizar projetos
- Atualizar e deletar seus próprios projetos

#### BILLING
- Gerenciar informações de cobrança
- Acesso restrito apenas a recursos de billing

### Estrutura de Permissões

As permissões são organizadas por **subjects**:

- **User** - Gerenciamento de usuários
- **Organization** - Gerenciamento de organizações
- **Project** - Gerenciamento de projetos
- **Invite** - Gerenciamento de convites
- **Billing** - Gerenciamento de cobrança

## Banco de Dados

### Modelos Principais

#### User
- Informações do usuário (nome, email, avatar)
- Autenticação (passwordHash)
- Relações: tokens, accounts, invites, membros, organizações, projetos

#### Organization
- Informações da organização (nome, slug, domínio)
- Owner (proprietário)
- Auto-attach por domínio
- Relações: membros, projetos, convites

#### Project
- Informações do projeto (nome, descrição, slug)
- Pertence a uma organização
- Possui um owner
- Avatar personalizado

#### Member
- Relacionamento entre User e Organization
- Define o role do usuário na organização

#### Invite
- Convites para organizações
- Define o role do convidado
- Relacionado ao autor do convite

#### Account
- Contas de provedores externos (GitHub)
- Autenticação OAuth

#### Token
- Tokens de recuperação de senha
- Tipos: PASSWORD_RECOVER

## Pré-requisitos

- Node.js >= 18
- pnpm >= 9.0.0
- Docker e Docker Compose (para PostgreSQL)

## Instalação

1. Clone o repositório:
```bash
git clone <repository-url>
cd saas-rbac
```

2. Instale as dependências:
```bash
pnpm install
```

3. Configure as variáveis de ambiente:
```bash
# apps/api/.env
DATABASE_URL="postgresql://docker:docker@localhost:5432/next-saas"
```

4. Inicie o banco de dados PostgreSQL:
```bash
docker-compose up -d
```

5. Execute as migrations do Prisma:
```bash
cd apps/api
pnpm prisma migrate dev
```

## Como Usar

### Desenvolvimento

Execute todos os serviços em modo de desenvolvimento:
```bash
pnpm dev
```

Ou execute apenas a API:
```bash
cd apps/api
pnpm dev
```

A API estará disponível em `http://localhost:3333`

### Build

Compile todos os pacotes:
```bash
pnpm build
```

### Lint

Execute o linter em todos os pacotes:
```bash
pnpm lint
```

### Type Check

Verifique os tipos TypeScript:
```bash
pnpm check-types
```

## Exemplo de Uso do Sistema RBAC

### Definindo Abilities para um Usuário

```typescript
import { defineAbilityFor } from '@saas/auth'

const user = {
  id: 'user-id',
  role: 'MEMBER'
}

const ability = defineAbilityFor(user)

// Verificar permissões
if (ability.can('create', 'Project')) {
  // Usuário pode criar projetos
}

if (ability.can('update', 'Project', { ownerId: user.id })) {
  // Usuário pode atualizar seus próprios projetos
}
```

### Estrutura de Subjects

```typescript
// Exemplo de subject Project
const projectSubject = z.tuple([
  z.union([
    z.literal('manage'),
    z.literal('get'),
    z.literal('create'),
    z.literal('update'),
    z.literal('delete'),
  ]),
  z.literal('Project'),
])
```

## Scripts Disponíveis

### Raiz do Projeto
- `pnpm dev` - Inicia todos os serviços em modo desenvolvimento
- `pnpm build` - Compila todos os pacotes
- `pnpm lint` - Executa o linter
- `pnpm check-types` - Verifica tipos TypeScript

### API (apps/api)
- `pnpm dev` - Inicia a API em modo watch

## Arquitetura

### Monorepo com Turborepo

O projeto utiliza Turborepo para gerenciar o build cache e paralelização de tarefas no monorepo.

### Separação de Responsabilidades

- **apps/api**: Contém a API REST e lógica de negócio
- **packages/auth**: Sistema RBAC reutilizável e independente
- **config/**: Configurações compartilhadas entre pacotes

### Type Safety

Todo o projeto utiliza TypeScript com validação runtime através do Zod, garantindo type safety em runtime e compile time.

### Database First com Prisma

O schema do Prisma é a fonte da verdade para os modelos de dados, com migrations versionadas.

## Contribuindo

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto é privado e não possui licença pública.

## Contato

Para dúvidas ou sugestões, entre em contato através das issues do repositório.
