# Notikfy Frontend

Frontend do Notikfy - Dashboard para notificações TikTok via Telegram

## 🚀 Tecnologias

- **React 18** - Biblioteca para construção de interfaces
- **TypeScript** - Superset do JavaScript com tipagem estática
- **Vite** - Build tool rápido e moderno
- **Material-UI (MUI)** - Biblioteca de componentes React
- **React Router** - Roteamento para SPA
- **React Hook Form** - Gerenciamento de formulários
- **React Query** - Gerenciamento de estado servidor
- **Firebase** - Autenticação e Firestore
- **PWA** - Progressive Web App

## 📋 Pré-requisitos

- Node.js 18+ (recomendado: Node.js 20+)
- npm ou yarn
- Conta Firebase configurada

## 🛠️ Instalação

1. Clone o repositório:
```bash
git clone <repo-url>
cd notikfy/frontend
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

Edite o arquivo `.env` e adicione suas credenciais do Firebase:
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
```

## 🏃 Desenvolvimento

Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

O projeto estará disponível em `http://localhost:5173`

## 🧪 Testes

Execute os testes:
```bash
npm test
```

Execute testes em modo watch:
```bash
npm run test:watch
```

Execute testes com coverage:
```bash
npm run test:coverage
```

## 🏗️ Build

Gere o build de produção:
```bash
npm run build
```

O build será gerado na pasta `dist/`

## 📦 Deploy

### Deploy no Firebase Hosting

1. Faça login no Firebase:
```bash
firebase login
```

2. Configure o projeto (se ainda não configurou):
```bash
firebase use <project-id>
```

3. Faça o deploy:
```bash
firebase deploy --only hosting
```

O deploy também pode ser feito diretamente da raiz do projeto, pois o `firebase.json` já está configurado para fazer o build do frontend antes do deploy.

## 📁 Estrutura do Projeto

```
frontend/
├── src/
│   ├── components/       # Componentes reutilizáveis
│   │   ├── common/       # Componentes comuns (ErrorBoundary, etc)
│   │   │   └── __tests__/  # Testes do componente
│   │   ├── layout/       # Componentes de layout (Header, SideMenu, etc)
│   │   │   └── __tests__/  # Testes dos componentes
│   │   └── forms/        # Componentes de formulário
│   ├── pages/            # Páginas da aplicação
│   │   ├── Login/
│   │   ├── Dashboard/
│   │   ├── Settings/
│   │   └── Sales/
│   ├── hooks/            # Custom hooks
│   ├── services/         # Serviços (Firebase, API)
│   │   ├── firebase/
│   │   └── api/
│   ├── context/          # React Contexts
│   ├── utils/            # Funções utilitárias
│   ├── types/            # Tipos TypeScript
│   ├── styles/           # Estilos globais e tema
│   ├── App.tsx           # Componente raiz
│   ├── main.tsx          # Entry point
│   └── router.tsx        # Configuração de rotas
├── public/               # Arquivos estáticos
├── package.json
├── vite.config.ts        # Configuração do Vite
├── tsconfig.json         # Configuração TypeScript
└── jest.config.js        # Configuração Jest
```

**Nota sobre Testes:** Os testes ficam junto ao código que testam, dentro de pastas `__tests__/` em cada componente/módulo. Isso facilita a manutenção e garante que os testes sejam criados junto com o código.

## 🎨 Convenções de Código

- Use TypeScript para todos os arquivos
- Siga os princípios SOLID
- Componentes devem ser testáveis
- Crie testes junto com o código
- Use Material-UI para componentes de UI
- Evite CSS inline, use classes CSS ou sx prop do MUI
- Siga as convenções de nomenclatura do guideline

## 📚 Scripts Disponíveis

- `npm run dev` - Inicia servidor de desenvolvimento
- `npm run build` - Gera build de produção
- `npm run preview` - Preview do build de produção
- `npm test` - Executa testes
- `npm run test:watch` - Executa testes em modo watch
- `npm run test:coverage` - Executa testes com coverage
- `npm run lint` - Executa ESLint
- `npm run lint:fix` - Corrige erros do ESLint
- `npm run format` - Formata código com Prettier
- `npm run format:check` - Verifica formatação

## 🔗 Links Úteis

- [Documentação React](https://react.dev)
- [Documentação Material-UI](https://mui.com)
- [Documentação Vite](https://vitejs.dev)
- [Documentação Firebase](https://firebase.google.com/docs)

## 📝 Licença

Este projeto é privado.

