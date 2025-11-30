# Tecnologias e Guia de Desenvolvimento - Backend

Este documento especifica as tecnologias, arquitetura e padrões recomendados para o desenvolvimento do backend do aplicativo Notikfy. O backend lida com webhooks do TikTok (para eventos de vendas), armazenamento de dados no Firestore, autenticação via Firebase, e envio de notificações via Telegram. 

O backend é 100% serverless, baseado na stack Firebase, para escalabilidade automática, performance otimizada e custos controlados (pay-per-use).

O foco é em simplicidade para um MVP rápido: use Cloud Functions para lógica de negócios, Firestore para dados persistentes, e integrações leves com APIs externas (TikTok e Telegram). Não há necessidade de servidores dedicados ou frameworks pesados.

## Plataforma Principal

### Firebase
- **Serviços Principais**: Cloud Functions, Cloud Firestore, Firebase Authentication
- **Motivo**: Plataforma serverless integrada, com escalabilidade global e gerenciamento automático. Facilita deploy rápido e integração com o frontend.
- **Uso**: Hospedar funções para webhooks, armazenar vendas e configurações de usuários, e autenticar acessos.

## Linguagem de Programação

### Node.js
- **Versão**: 20 ou superior (compatível com Cloud Functions v2)
- **Motivo**: Runtime padrão para Cloud Functions no Firebase. Leve, assíncrono e com vasto ecossistema de pacotes NPM.
- **Uso**: Escrever lógica para processar webhooks, validar eventos, armazenar dados e enviar notificações.

### TypeScript (Recomendado)
- **Versão**: 5.0 ou superior
- **Motivo**: Tipagem estática para código mais robusto, especialmente com SDKs. Facilita manutenção e reduz erros em runtime.
- **Configuração**: Use `strict: true` no `tsconfig.json` para máxima segurança de tipos.

## Funções Serverless

### Cloud Functions for Firebase
- **Tipo**: HTTP triggers para webhooks e background functions para tarefas assíncronas
- **Motivo**: Executa código sob demanda, sem gerenciamento de infraestrutura. Escalável para picos de tráfego (ex.: muitas vendas simultâneas).
- **Uso**: Endpoint para webhook do TikTok (receber POST, validar assinatura, salvar no Firestore, enviar notificação Telegram).
- **Otimização**: Mantenha funções curtas (<5s) para minimizar custos. Para tarefas longas, use Cloud Tasks ou Pub/Sub.

## Arquitetura e Estrutura de Pastas

```
functions/
├── src/
│   ├── index.ts              # Entry point, exporta todas as functions
│   ├── config/               # Configurações e variáveis de ambiente
│   │   ├── firebase.config.ts
│   │   └── constants.ts
│   ├── webhooks/             # Handlers de webhooks
│   │   ├── tiktok.webhook.ts
│   │   └── tiktok.validator.ts
│   ├── services/             # Lógica de negócios
│   │   ├── sale.service.ts
│   │   ├── notification.service.ts
│   │   └── user.service.ts
│   ├── models/               # Interfaces e tipos TypeScript
│   │   ├── sale.model.ts
│   │   ├── user.model.ts
│   │   └── webhook.model.ts
│   ├── utils/                # Funções utilitárias
│   │   ├── logger.ts
│   │   ├── errors.ts
│   │   └── validators.ts
│   └── middleware/           # Middlewares para functions
│       ├── auth.middleware.ts
│       └── error.middleware.ts
├── __tests__/                # Testes unitários
│   ├── webhooks/
│   ├── services/
│   └── utils/
├── package.json
├── tsconfig.json
└── .env.example
```

## Banco de Dados

### Cloud Firestore
- **Motivo**: Banco NoSQL real-time, escalável e integrado ao Firebase. Suporta queries eficientes e listeners para updates.
- **Uso**: Armazenar coleções como:
  - `usuarios` (com configs TikTok e Telegram: token, chat_id, webhook_url)
  - `vendas` (detalhes de eventos do webhook: timestamp, valor, produto, etc.)
  - `logs` (opcional, para auditoria)
- **Índices**: Defina índices compostos para performance em queries por `user_id` e `timestamp`.
- **Segurança**: Use Firebase Security Rules para restringir acessos (ex.: só usuário autenticado edita seus dados).

### Estrutura de Dados Sugerida

**Coleção `usuarios`:**
```typescript
{
  uid: string;                    // Firebase Auth UID
  email: string;
  displayName: string;
  tiktok: {
    accessToken: string;          // Criptografado
    webhookUrl: string;
    isValid: boolean;
  };
  telegram: {
    botToken: string;             // Criptografado
    chatId: string;
    isConfigured: boolean;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Coleção `vendas`:**
```typescript
{
  id: string;
  userId: string;                 // Referência ao usuário
  orderId: string;                // ID da venda no TikTok
  productName: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'refunded';
  webhookData: object;            // Dados completos do webhook
  notificationSent: boolean;
  createdAt: Timestamp;
}
```

## Autenticação

### Firebase Authentication
- **Provedor**: Google Sign-in
- **Motivo**: Integração nativa e segura, com tokens JWT para autorização.
- **Uso**: Validar usuários no backend (ex.: em functions, cheque auth via middleware).

## Integrações Externas

### TikTok Webhook API
- **Motivo**: Recebe eventos de vendas em tempo real.
- **Uso**: Em Cloud Functions, parse payloads JSON, valide assinatura (use bibliotecas como crypto para HMAC se necessário).
- **Validação**: Sempre validar assinatura HMAC antes de processar webhook.
- **Retry**: Implementar retry logic para falhas temporárias.

### Telegram Bot API
- **Biblioteca**: `node-telegram-bot-api` ou `fetch` nativo para simplicidade
- **Motivo**: Envio de mensagens assíncronas via HTTP. Gratuito para bots básicos.
- **Uso**: Após processar webhook, envie mensagem via endpoint `/sendMessage`. Armazene token e chat_id no Firestore.
- **Formatação**: Use Markdown ou HTML para formatação de mensagens.
- **Rate Limiting**: Respeitar limites do Telegram (30 mensagens/segundo).

## Bibliotecas e Pacotes NPM

### Dependências Principais
- **firebase-admin**: SDK para acessar Firestore e Auth do backend
- **express**: Middleware para handling de HTTP requests no webhook (opcional, mas recomendado)
- **crypto** (nativo Node.js): Validar assinaturas de webhooks (ex.: HMAC do TikTok)
- **node-fetch** ou similar: Chamadas HTTP para Telegram API (se não usar telegram-bot-api)

### Dependências de Desenvolvimento
- **typescript**: Compilador TypeScript
- **@types/node**: Tipos para Node.js
- **@types/express**: Tipos para Express
- **eslint**: Linter de código
- **prettier**: Formatação de código
- **jest**: Framework de testes
- **@types/jest**: Tipos para Jest
- **ts-jest**: Suporte TypeScript para Jest

## Ferramentas de Desenvolvimento e Deploy

### Firebase CLI
- **Motivo**: Para inicializar projeto, emular functions localmente e deploy.
- **Uso**: 
  - `firebase init functions`: Inicializar projeto
  - `firebase emulators:start`: Rodar emuladores localmente
  - `firebase deploy --only functions`: Deploy das functions
  - `firebase functions:log`: Ver logs

### ESLint + Prettier
- **Motivo**: Manter código limpo e consistente.
- **Configuração**: Usar regras recomendadas para TypeScript + Node.js.

### Node Package Manager (NPM ou Yarn)
- **Motivo**: Gerenciar dependências no package.json das functions.

## Variáveis de Ambiente

Criar arquivo `.env.example` com as seguintes variáveis:

```bash
# Firebase
FIREBASE_PROJECT_ID=your-project-id

# TikTok Webhook
TIKTOK_WEBHOOK_SECRET=your-webhook-secret

# Telegram (opcional, pode ser por usuário)
TELEGRAM_BOT_TOKEN=default-bot-token

# Configurações
NODE_ENV=development
```

**Importante**: 
- Nunca commitar arquivo `.env` com valores reais
- Usar Firebase Functions Config para variáveis de produção: `firebase functions:config:set`

## Convenções de Código

### Nomenclatura
- **Funções**: `camelCase` (ex: `processWebhook`, `sendNotification`)
- **Constantes**: `UPPER_SNAKE_CASE` (ex: `MAX_RETRY_ATTEMPTS`)
- **Interfaces/Types**: `PascalCase` (ex: `SaleData`, `WebhookPayload`)
- **Arquivos**: `kebab-case` (ex: `tiktok.webhook.ts`, `sale.service.ts`)

### Organização de Imports
1. Bibliotecas externas (firebase-admin, express, etc.)
2. Bibliotecas internas/compartilhadas
3. Models/Types
4. Utilitários
5. Arquivos relativos

### Tratamento de Erros

Sempre usar try-catch em funções assíncronas e retornar erros apropriados:

```typescript
export const tiktokWebhook = functions.https.onRequest(async (req, res) => {
  try {
    // Validação
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Processamento
    const result = await processWebhook(req.body);
    
    res.status(200).json({ success: true, data: result });
  } catch (error) {
    logger.error('Webhook processing failed', { error });
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
```

### Logging

Usar logs estruturados para facilitar debugging:

```typescript
import * as functions from 'firebase-functions';

const logger = {
  info: (message: string, data?: any) => {
    functions.logger.info(message, data);
  },
  error: (message: string, error?: any) => {
    functions.logger.error(message, error);
  },
  warn: (message: string, data?: any) => {
    functions.logger.warn(message, data);
  }
};
```

## Segurança e Performance

### Firebase Security Rules
Defina regras granulares para Firestore:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /usuarios/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /vendas/{saleId} {
      allow read: if request.auth != null && 
                     request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
  }
}
```

### Validação e Sanitização
- Validar todos os inputs de webhooks
- Sanitizar dados antes de salvar no Firestore
- Validar assinaturas HMAC antes de processar

### Rate Limiting
- Implementar rate limiting em webhooks (ex.: via middleware Express)
- Considerar Firebase App Check para proteção adicional

### Criptografia
- Armazene dados sensíveis (tokens Telegram) com campos criptografados
- Use Firebase Extensions ou bibliotecas de criptografia para tokens

### Monitoring
- Use Firebase Console para logs, performance metrics e alertas de custos
- Configure alertas para erros e custos elevados

### Otimizações
- **Cold start mitigation**: Use min instances em functions críticas (custo extra, use só se necessário)
- **Paginação**: Use paginação em queries do Firestore
- **Índices**: Crie índices compostos para queries complexas
- **Cache**: Considere cache em memória para dados frequentemente acessados (seguindo limites de memória)

## Testes

### Regra Fundamental: Testes Simultâneos
**Ao criar qualquer função, serviço ou handler, sempre criar o teste correspondente simultaneamente.**
- Não deixe para criar testes depois - eles são parte integrante do código
- Testes garantem que o código funciona e servem como documentação viva
- Código novo = Testes novos. Nunca commitar código sem seus testes correspondentes

### Design para Testabilidade
Funções e serviços devem ser projetados para serem facilmente testáveis:
- Use injeção de dependências para facilitar mocks
- Separe lógica de negócios de acesso a banco/APIs externas
- Prefira funções puras quando possível (sem side effects)
- Mantenha funções pequenas e focadas (mais fáceis de testar)

### Estrutura de Testes
- Usar Jest como framework de testes
- Testar funções isoladamente (unit tests)
- Usar Firebase Emulators para testes de integração
- Organizar testes em estrutura espelhada ao código: `__tests__/webhooks/`, `__tests__/services/`, etc.

### Exemplo de Teste

```typescript
import { processWebhook } from '../src/webhooks/tiktok.webhook';

describe('processWebhook', () => {
  it('should validate webhook signature', async () => {
    const payload = { /* ... */ };
    const signature = 'valid-signature';
    
    const result = await processWebhook(payload, signature);
    
    expect(result.success).toBe(true);
  });

  it('should reject invalid signature', async () => {
    const payload = { /* ... */ };
    const signature = 'invalid-signature';
    
    await expect(processWebhook(payload, signature))
      .rejects.toThrow('Invalid signature');
  });
});
```

### Cobertura de Testes
- Almejar pelo menos 70% de cobertura para código crítico
- Testar casos de sucesso e falha
- Testar edge cases e validações

## Instalação e Setup Inicial

### Passo a Passo

1. **Instale Firebase CLI**:
   ```bash
   npm install -g firebase-tools
   ```

2. **Faça login no Firebase**:
   ```bash
   firebase login
   ```

3. **Crie projeto no Firebase Console** e inicialize localmente:
   ```bash
   firebase init functions
   ```
   - Escolha TypeScript
   - Instale dependências quando solicitado

4. **Instale dependências principais**:
   ```bash
   cd functions
   npm install firebase-admin express node-telegram-bot-api
   npm install -D typescript @types/node @types/express jest ts-jest @types/jest
   ```

5. **Configure variáveis de ambiente**:
   - Copie `.env.example` para `.env`
   - Preencha com valores reais (não commitar)

6. **Estruture o projeto** conforme a arquitetura sugerida

7. **Escreva functions** em `src/index.ts`:
   ```typescript
   import * as functions from 'firebase-functions';
   import { tiktokWebhook } from './webhooks/tiktok.webhook';

   export const webhook = functions.https.onRequest(tiktokWebhook);
   ```

8. **Teste localmente** com emuladores:
   ```bash
   firebase emulators:start
   ```

9. **Deploy**:
   ```bash
   firebase deploy --only functions
   ```

## Padrões de API

### Estrutura de Resposta

**Sucesso (200)**:
```json
{
  "success": true,
  "data": { /* dados */ },
  "message": "Operação realizada com sucesso"
}
```

**Erro (400-500)**:
```json
{
  "success": false,
  "error": "Error code",
  "message": "Descrição do erro",
  "details": { /* detalhes adicionais, opcional */ }
}
```

### Códigos de Status HTTP
- `200`: Sucesso
- `400`: Bad Request (validação falhou)
- `401`: Unauthorized (não autenticado)
- `403`: Forbidden (sem permissão)
- `404`: Not Found
- `405`: Method Not Allowed
- `500`: Internal Server Error

## Considerações Finais

### Performance
- Funções escalam automaticamente; monitore latência no console
- Use Cloud Functions v2 para melhor performance e custos

### Custos
- Pay-per-use (ex.: $0.40/milhão de invocações)
- Otimize com funções eficientes e deleção de dados antigos
- Configure alertas de custo no Firebase Console

### Escalabilidade
- Para crescimento, adicione Pub/Sub para decoupling se volume de webhooks aumentar
- Considere Cloud Tasks para processamento assíncrono de tarefas longas

### Versões
- Use as mais recentes compatíveis com Firebase (verifique docs em 2025)
- Mantenha dependências atualizadas para segurança

### Documentação
- Documente todas as functions com JSDoc
- Mantenha README.md atualizado
- Documente payloads de webhook esperados

Este setup permite um backend funcional em poucas horas, integrado ao frontend. Ajustes podem ser feitos com base em requisitos específicos.
