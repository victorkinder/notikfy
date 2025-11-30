# Guidelines Gerais do Projeto Notikfy

Este documento contém padrões e convenções compartilhadas entre backend e frontend do projeto Notikfy.

## Estrutura do Repositório

```
notikfy/
├── backend/          # Cloud Functions (Firebase)
├── frontend/         # React SPA
└── docs/            # Documentação adicional (opcional)
```

## Versionamento (Git)

### Estratégia de Branches
- **Branch principal**: `main` (produção)
- **Branches de feature**: `feature/nome-da-feature`
- **Branches de bugfix**: `bugfix/descricao-do-bug`
- **Branches de hotfix**: `hotfix/descricao-urgente`

### Convenção de Commits
Seguir o padrão [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body> (opcional)

<footer> (opcional)
```

**Tipos:**
- `feat`: Nova funcionalidade
- `fix`: Correção de bug
- `docs`: Documentação
- `style`: Formatação (não afeta código)
- `refactor`: Refatoração
- `test`: Testes
- `chore`: Tarefas de manutenção

**Exemplos:**
```
feat(backend): adiciona validação de assinatura de webhook TikTok
fix(frontend): corrige exibição de vendas no dashboard
docs: atualiza README com instruções de setup
```

## Padrões Compartilhados

### TypeScript
- **Versão mínima**: 5.0+
- Usar tipagem estrita (`strict: true`)
- Preferir `interface` para objetos, `type` para unions/intersections
- Evitar `any` - usar `unknown` quando necessário

### Variáveis de Ambiente
- Usar arquivos `.env` para configurações locais
- Criar `.env.example` como template (sem valores sensíveis)
- **NUNCA** commitar arquivos `.env` com credenciais
- Documentar todas as variáveis necessárias

**Estrutura sugerida:**
```
.env.example          # Template com nomes das variáveis
.env.local            # Valores locais (gitignored)
.env.production       # Valores de produção (se necessário)
```

### ESLint e Prettier
- Configuração padronizada entre projetos
- Executar lint antes de commits (via husky ou similar)
- Formatação automática no save (configurar no editor)

### Testes
- **Backend**: Jest para unit tests das Cloud Functions
- **Frontend**: Jest + React Testing Library para componentes
- Cobertura mínima recomendada: 70% para código crítico
- Testes devem ser independentes e isolados
- **IMPORTANTE**: Ao criar qualquer componente, função ou serviço, **sempre criar o teste correspondente simultaneamente**
- Componentes e funções devem ser projetados para serem facilmente testáveis (evitar dependências complexas, usar injeção de dependências)

### Logging e Monitoramento
- Usar logs estruturados (JSON format)
- Níveis: `error`, `warn`, `info`, `debug`
- Backend: Firebase Functions Logs
- Frontend: Console logs em desenvolvimento, serviços de logging em produção

### Segurança
- **NUNCA** expor credenciais no código
- Validar e sanitizar todos os inputs
- Usar Firebase Security Rules no Firestore
- Implementar rate limiting em endpoints públicos
- Headers de segurança apropriados (CORS, CSP, etc.)

## Boas Práticas de Programação

Este projeto prioriza a aplicação de princípios e práticas de engenharia de software para garantir código de alta qualidade, manutenível e escalável.

### Princípios SOLID

#### S - Single Responsibility Principle (Princípio da Responsabilidade Única)
- Cada classe, função ou componente deve ter apenas uma razão para mudar
- Uma função deve fazer apenas uma coisa, mas fazer bem
- **Exemplo**: Separar validação de dados, lógica de negócios e acesso ao banco em módulos distintos

```typescript
// ❌ Ruim: Uma função fazendo muitas coisas
function processSale(data: any) {
  // Valida dados
  if (!data.amount) throw new Error('Amount required');
  // Busca usuário
  const user = await getUser(data.userId);
  // Salva no banco
  await saveSale(data);
  // Envia notificação
  await sendNotification(user);
}

// ✅ Bom: Responsabilidades separadas
async function processSale(data: SaleData) {
  validateSaleData(data);
  const user = await userService.getById(data.userId);
  const sale = await saleService.create(data);
  await notificationService.send(user, sale);
}
```

#### O - Open/Closed Principle (Princípio Aberto/Fechado)
- Entidades devem estar abertas para extensão, mas fechadas para modificação
- Use interfaces e abstrações para permitir extensão sem modificar código existente

```typescript
// ✅ Bom: Extensível via interface
interface NotificationService {
  send(message: string): Promise<void>;
}

class TelegramNotificationService implements NotificationService {
  async send(message: string) { /* ... */ }
}

class EmailNotificationService implements NotificationService {
  async send(message: string) { /* ... */ }
}
```

#### L - Liskov Substitution Principle (Princípio da Substituição de Liskov)
- Objetos derivados devem ser substituíveis por seus tipos base
- Mantenha contratos consistentes em hierarquias de classes/interfaces

#### I - Interface Segregation Principle (Princípio da Segregação de Interfaces)
- Clientes não devem depender de interfaces que não usam
- Prefira interfaces pequenas e específicas a interfaces grandes e genéricas

```typescript
// ❌ Ruim: Interface muito grande
interface UserService {
  create(data: any): Promise<User>;
  update(id: string, data: any): Promise<User>;
  delete(id: string): Promise<void>;
  sendEmail(user: User): Promise<void>;
  generateReport(user: User): Promise<Report>;
}

// ✅ Bom: Interfaces segregadas
interface UserRepository {
  create(data: any): Promise<User>;
  update(id: string, data: any): Promise<User>;
  delete(id: string): Promise<void>;
}

interface EmailService {
  send(user: User): Promise<void>;
}
```

#### D - Dependency Inversion Principle (Princípio da Inversão de Dependência)
- Dependa de abstrações, não de implementações concretas
- Use injeção de dependências para facilitar testes e manutenção

```typescript
// ❌ Ruim: Dependência direta de implementação
class SaleService {
  private db = new Firestore();
  async save(sale: Sale) {
    await this.db.collection('sales').add(sale);
  }
}

// ✅ Bom: Dependência de abstração
interface Database {
  save(collection: string, data: any): Promise<void>;
}

class SaleService {
  constructor(private db: Database) {}
  async save(sale: Sale) {
    await this.db.save('sales', sale);
  }
}
```

### DRY - Don't Repeat Yourself (Não Se Repita)

- Evite duplicação de código - extraia lógica comum para funções/componentes reutilizáveis
- Se você precisa fazer a mesma coisa em 3+ lugares, crie uma função/componente compartilhado
- **Cuidado**: Não force reutilização quando não faz sentido (ex.: lógicas completamente diferentes)

```typescript
// ❌ Ruim: Código duplicado
function formatDate1(date: Date) {
  return date.toLocaleDateString('pt-BR');
}

function formatDate2(date: Date) {
  return date.toLocaleDateString('pt-BR');
}

// ✅ Bom: Função reutilizável
function formatDate(date: Date, locale: string = 'pt-BR'): string {
  return date.toLocaleDateString(locale);
}
```

### KISS - Keep It Simple, Stupid (Mantenha Simples)

- Prefira soluções simples e diretas a soluções complexas e "elegantes"
- O código deve ser fácil de entender para qualquer desenvolvedor do time
- **YAGNI** (You Aren't Gonna Need It): Não implemente funcionalidades "por precaução" - implemente quando necessário

```typescript
// ❌ Ruim: Solução complexa desnecessária
const result = data
  .filter(x => x.active)
  .map(x => ({ ...x, processed: true }))
  .reduce((acc, curr) => {
    acc[curr.id] = curr;
    return acc;
  }, {});

// ✅ Bom: Solução simples e clara
const activeItems = data.filter(item => item.active);
```

### Separation of Concerns (Separação de Responsabilidades)

- Separe preocupações diferentes em módulos/componentes distintos
- **Frontend**: Separe lógica de apresentação (componentes) de lógica de negócios (hooks/services)
- **Backend**: Separe rotas/handlers, serviços (lógica de negócios), e acesso a dados (repositórios)

```typescript
// ❌ Ruim: Componente fazendo tudo
function Dashboard() {
  const [sales, setSales] = useState([]);
  
  useEffect(() => {
    // Lógica de busca
    fetch('/api/sales').then(r => r.json()).then(setSales);
  }, []);
  
  // Lógica de formatação
  const formatted = sales.map(s => ({
    ...s,
    date: new Date(s.date).toLocaleDateString(),
    amount: `R$ ${s.amount.toFixed(2)}`
  }));
  
  // Lógica de apresentação
  return <div>{/* ... */}</div>;
}

// ✅ Bom: Responsabilidades separadas
function Dashboard() {
  const { sales, loading } = useSales(); // Hook customizado
  const formattedSales = formatSales(sales); // Utilitário
  
  return <SalesList sales={formattedSales} loading={loading} />;
}
```

### Clean Code

#### Nomes Significativos
- Use nomes descritivos que expliquem o propósito
- Evite abreviações e nomes genéricos (`data`, `temp`, `x`)

```typescript
// ❌ Ruim
function calc(d: number, q: number) { return d * q; }

// ✅ Bom
function calculateTotal(unitPrice: number, quantity: number): number {
  return unitPrice * quantity;
}
```

#### Funções Pequenas e Focadas
- Funções devem ser curtas (idealmente < 20 linhas)
- Uma função deve fazer apenas uma coisa
- Se uma função tem muitos parâmetros (> 3), considere usar um objeto

```typescript
// ❌ Ruim: Função muito longa com múltiplas responsabilidades
function processWebhook(payload: any) {
  // 50 linhas de código fazendo validação, transformação, salvamento, etc.
}

// ✅ Bom: Funções pequenas e focadas
function processWebhook(payload: WebhookPayload) {
  const validated = validateWebhookPayload(payload);
  const sale = transformToSale(validated);
  await saveSale(sale);
  await sendNotification(sale);
}
```

#### Evitar Side Effects
- Funções devem ser previsíveis - mesma entrada, mesma saída
- Isole side effects (IO, mutações) em funções específicas

### Testabilidade

**Componentes e funções devem ser projetados para serem facilmente testáveis:**

1. **Injeção de Dependências**: Dependências externas devem ser injetadas, não instanciadas dentro da função
2. **Funções Puras quando possível**: Funções sem side effects são mais fáceis de testar
3. **Separação de Lógica e IO**: Separe lógica de negócios de acesso a banco/API
4. **Mockabilidade**: Torne dependências fáceis de mockar em testes

```typescript
// ❌ Ruim: Difícil de testar
class SaleService {
  async processSale(data: any) {
    const db = new Firestore(); // Instanciação interna
    const user = await db.collection('users').doc(data.userId).get();
    // Lógica misturada com IO
  }
}

// ✅ Bom: Fácil de testar
class SaleService {
  constructor(
    private userRepository: UserRepository,
    private saleRepository: SaleRepository
  ) {}
  
  async processSale(data: SaleData) {
    const user = await this.userRepository.findById(data.userId);
    // Lógica de negócios pura
    return this.saleRepository.save(transformToSale(data, user));
  }
}
```

### Regra de Testes: TDD ou Testes Simultâneos

- **Ao criar qualquer componente, função ou serviço, sempre criar o teste correspondente simultaneamente**
- Não deixe para criar testes depois - eles são parte integrante do código
- Testes garantem que o código funciona e servem como documentação viva

**Workflow recomendado:**
1. Escreva o teste primeiro (TDD) ou junto com o código
2. Implemente a funcionalidade mínima para o teste passar
3. Refatore se necessário, mantendo os testes passando

**Estrutura de arquivos para componentes testáveis:**

```
components/
└── SaleCard/
    ├── SaleCard.tsx        # Componente
    ├── SaleCard.test.tsx   # Teste (criado junto!)
    ├── SaleCard.styles.ts  # Estilos (se necessário)
    └── index.ts            # Export
```

## Convenções de Código

### Nomenclatura
- **Variáveis e funções**: `camelCase`
- **Componentes React**: `PascalCase`
- **Constantes**: `UPPER_SNAKE_CASE`
- **Arquivos**: `kebab-case` para utilitários, `PascalCase` para componentes

### Organização de Imports
Ordem sugerida:
1. Bibliotecas externas (React, Firebase, etc.)
2. Bibliotecas internas/compartilhadas
3. Componentes
4. Utilitários e helpers
5. Tipos e interfaces
6. Arquivos relativos (com `./` ou `../`)

**Exemplo:**
```typescript
// 1. Bibliotecas externas
import React, { useState, useEffect } from 'react';
import { getAuth } from 'firebase/auth';

// 2. Componentes
import { Button } from '@mui/material';

// 3. Utilitários
import { formatDate } from '../utils/date';

// 4. Tipos
import { User } from '../types/user';

// 5. Relativos
import { CustomComponent } from './CustomComponent';
```

### Comentários
- Comentar código complexo ou não óbvio
- Usar JSDoc para funções públicas
- Manter comentários atualizados com o código
- Preferir código auto-explicativo a comentários

**Exemplo JSDoc:**
```typescript
/**
 * Valida e processa um webhook do TikTok
 * @param payload - Payload JSON do webhook
 * @param signature - Assinatura HMAC para validação
 * @returns Objeto com resultado do processamento
 */
async function processWebhook(payload: any, signature: string) {
  // ...
}
```

## Workflow de Desenvolvimento

1. **Criar branch** a partir de `main`
2. **Desenvolver** seguindo os padrões
3. **Escrever testes simultaneamente** - Ao criar componentes, funções ou serviços, sempre criar os testes correspondentes no mesmo momento (não deixar para depois)
4. **Validar** com lint e testes (todos os testes devem passar)
5. **Criar Pull Request** para revisão
6. **Merge** após aprovação

**Regra de Ouro**: Código novo = Testes novos. Nunca commitar código sem seus testes correspondentes.

## Ferramentas Recomendadas

- **Editor**: VS Code com extensões ESLint, Prettier, TypeScript
- **Git**: Interface gráfica opcional (SourceTree, GitKraken, etc.)
- **API Testing**: Postman ou Insomnia para testar webhooks
- **Firebase Console**: Para monitoramento e configuração

## Documentação

- Manter README.md atualizado em cada módulo
- Documentar APIs e endpoints
- Incluir exemplos de uso
- Manter changelog para versões principais

## Contato e Suporte

Para dúvidas sobre padrões ou convenções, consultar este documento primeiro ou discutir com o time.

