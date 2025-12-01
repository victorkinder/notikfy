# Backend - Notikfy

Backend serverless do Notikfy usando Firebase Cloud Functions, Firestore e integração com webhooks do TikTok e notificações via Telegram.

## Estrutura do Projeto

```
backend/
├── functions/
│   ├── src/
│   │   ├── config/          # Configurações (Firebase, constantes)
│   │   ├── webhooks/        # Handlers de webhooks
│   │   ├── services/        # Lógica de negócios
│   │   ├── models/          # Interfaces e tipos TypeScript
│   │   ├── utils/           # Funções utilitárias
│   │   └── middleware/      # Middlewares para functions
│   ├── __tests__/           # Testes unitários
│   └── package.json
├── firestore.rules          # Regras de segurança do Firestore
└── README.md
```

## Pré-requisitos

- **Node.js**: versão 20 ou superior
- **Firebase CLI**: instalar globalmente com `npm install -g firebase-tools`
- **Conta Firebase**: projeto criado no [Firebase Console](https://console.firebase.google.com/)

## Instalação e Setup

### 1. Instalar Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Fazer login no Firebase

```bash
firebase login
```

### 3. Inicializar projeto Firebase (se ainda não foi feito)

Na raiz do projeto, execute:

```bash
firebase init functions
```

**Opções recomendadas:**
- Escolha TypeScript como linguagem
- Use ESLint para linting
- Instale dependências quando solicitado

### 4. Instalar dependências

```bash
cd backend/functions
npm install
```

### 5. Configurar variáveis de ambiente

Copie o arquivo de exemplo e configure suas variáveis:

```bash
cp env.example .env
```

Edite o arquivo `.env` com seus valores reais:
- `FIREBASE_PROJECT_ID`: ID do seu projeto Firebase
- `TIKTOK_WEBHOOK_SECRET`: Secret para validar webhooks do TikTok
- `TELEGRAM_BOT_TOKEN`: Token do bot Telegram (opcional)
- `KIWIFY_SECRET_KEY`: Chave secreta para validar assinatura HMAC dos webhooks da Kiwify (fornecido pela Kiwify: `3ienivdzi7c`)
- (Alternativa: `KIWIFY_WEBHOOK_TOKEN` também funciona para compatibilidade)
- `NODE_ENV`: Ambiente (development, staging, production)

**Importante**: 
- Nunca commite o arquivo `.env` com valores reais!
- A chave secreta da Kiwify (`3ienivdzi7c`) é usada para calcular e validar a assinatura HMAC SHA1 dos webhooks
- A validação usa assinatura HMAC no query parameter `signature`, não token no header

### 6. Compilar TypeScript

```bash
npm run build
```

## Desenvolvimento

### Rodar emuladores localmente

Para testar as functions localmente antes do deploy:

```bash
npm run serve
```

Isso iniciará os emuladores do Firebase (Functions e Firestore) em:
- Functions: http://localhost:5001
- Firestore: http://localhost:8080
- UI: http://localhost:4000

### Executar testes

```bash
# Todos os testes
npm test

# Modo watch (para desenvolvimento)
npm run test:watch

# Com cobertura
npm run test:coverage
```

### Linting e formatação

```bash
# Verificar problemas de lint
npm run lint

# Corrigir problemas automaticamente
npm run lint:fix

# Formatar código
npm run format

# Verificar formatação
npm run format:check
```

## Deploy

### Deploy das Functions

```bash
npm run deploy
```

Ou especificamente:

```bash
firebase deploy --only functions
```

### Deploy das Firestore Rules

```bash
firebase deploy --only firestore:rules
```

### Deploy completo

```bash
firebase deploy
```

## Estrutura de Dados

### Coleção `usuarios`

Armazena dados dos usuários e suas configurações:

```typescript
{
  uid: string;              // Firebase Auth UID
  email: string;
  displayName: string;
  tiktok: {
    accessToken: string;    // Criptografado
    webhookUrl: string;
    isValid: boolean;
  };
  telegram: {
    botToken: string;       // Criptografado
    chatId: string;
    isConfigured: boolean;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### Coleção `vendas`

Armazena eventos de vendas recebidos via webhook:

```typescript
{
  id: string;
  userId: string;           // Referência ao usuário
  orderId: string;          // ID da venda no TikTok
  productName: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'refunded';
  webhookData: object;      // Dados completos do webhook
  notificationSent: boolean;
  createdAt: Timestamp;
}
```

## Endpoints Disponíveis

### Health Check

```
GET /healthCheck
```

Verifica se o serviço está funcionando corretamente.

### Hello World (Exemplo)

```
GET /helloWorld
```

Endpoint de exemplo que retorna uma mensagem de boas-vindas.

### Webhook Kiwify

```
POST /kiwifyWebhook
```

Endpoint para receber webhooks da Kiwify. Processa os seguintes eventos:
- `order_approved`: Quando uma compra é aprovada
- `subscription_renewed`: Quando uma assinatura é renovada
- `subscription_canceled`: Quando uma assinatura é cancelada
- `chargeback`: Quando ocorre um chargeback

**Autenticação:**
- A validação é feita através de assinatura HMAC SHA1
- A assinatura vem no query parameter: `?signature=<hmac-signature>`
- Chave secreta: `3ienivdzi7c` (fornecido pela Kiwify, configurada como `KIWIFY_SECRET_KEY`)
- O backend calcula a assinatura esperada usando HMAC SHA1 do payload JSON e compara com a recebida

**Configuração na Kiwify:**
Após o deploy, configure a URL do webhook na plataforma Kiwify:
```
https://<região>-<projeto-id>.cloudfunctions.net/kiwifyWebhook
```

Exemplo:
```
https://us-central1-seu-projeto-id.cloudfunctions.net/kiwifyWebhook
```

## Scripts Disponíveis

- `npm run build` - Compila TypeScript para JavaScript
- `npm run serve` - Inicia emuladores localmente
- `npm run deploy` - Faz deploy das functions
- `npm run logs` - Visualiza logs das functions
- `npm test` - Executa testes
- `npm run lint` - Verifica código com ESLint
- `npm run format` - Formata código com Prettier

## Convenções de Código

Siga os padrões definidos no [GUIDLINE.MD](./GUIDLINE.MD):

- **Nomenclatura**: camelCase para funções, PascalCase para interfaces/types
- **SOLID**: Aplicar princípios SOLID sempre que possível
- **Testes**: Criar testes simultaneamente ao código
- **TypeScript**: Usar tipagem estrita (`strict: true`)

## Segurança

- Firebase Security Rules estão configuradas em `firestore.rules`
- Variáveis sensíveis devem estar em `.env` (nunca commitar)
- Para **ambientes na nuvem** (DEV, Staging, Production), configure via Firebase Console ou CLI

### Configurar Variáveis de Ambiente na Nuvem

Como estamos usando **Firebase Functions v2**, você tem duas opções:

#### Opção 1: Via Firebase Console (Recomendado - Mais Fácil)

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione seu projeto
3. Vá em **Functions** → **Configuração** (ou **Configuration**)
4. Na aba **Environment variables**, adicione:
   - Nome: `KIWIFY_SECRET_KEY`
   - Valor: `3ienivdzi7c`
   - (ou `KIWIFY_WEBHOOK_TOKEN` também funciona para compatibilidade)
5. Clique em **Salvar**
6. Faça o deploy novamente das functions:
   ```bash
   firebase deploy --only functions
   ```

#### Opção 2: Via Firebase CLI (Usando Secrets - Mais Seguro)

Para valores sensíveis, você pode usar Secrets do Firebase:

```bash
# Criar o secret
echo -n "3ienivdzi7c" | firebase functions:secrets:set KIWIFY_SECRET_KEY

# Para DEV (se tiver projeto separado)
firebase use dev-project-id
echo -n "3ienivdzi7c" | firebase functions:secrets:set KIWIFY_SECRET_KEY

# Para PROD (quando chegar a hora)
firebase use prod-project-id
echo -n "3ienivdzi7c" | firebase functions:secrets:set KIWIFY_SECRET_KEY
```

**Nota:** 
- A chave secreta da Kiwify (`3ienivdzi7c`) foi fornecida pela própria Kiwify
- A validação usa assinatura HMAC SHA1 no query parameter `signature`, não token no header
- Para ambiente DEV na nuvem, use a **Opção 1** (via Console) - é mais simples e rápido
- Secrets são mais seguros para produção, mas requerem ajustes no código para usar `defineSecret`

## Monitoramento

- Visualize logs no [Firebase Console](https://console.firebase.google.com/)
- Monitore performance e custos no dashboard do Firebase
- Configure alertas para erros e custos elevados

## Próximos Passos

1. Implementar handler de webhook do TikTok
2. Implementar serviço de notificações Telegram
3. Criar serviços de vendas e usuários
4. Adicionar validação de assinatura HMAC para webhooks

## Documentação Adicional

- [Firebase Functions Docs](https://firebase.google.com/docs/functions)
- [Firestore Docs](https://firebase.google.com/docs/firestore)
- [Guidelines do Projeto](../GUIDELINE.MD)
- [Backend Guidelines](./GUIDLINE.MD)

## Suporte

Para dúvidas ou problemas, consulte a documentação do Firebase ou os guidelines do projeto.

Url ambiente dev:
https://us-central1-minerx-app-login.cloudfunctions.net/...