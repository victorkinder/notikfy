# Configuração da Chave Secreta da Kiwify

## Ambiente DEV na Nuvem

Para configurar a chave secreta da Kiwify no ambiente DEV na nuvem, siga um dos métodos abaixo:

### Método 1: Firebase Console (Recomendado - Mais Rápido)

1. Acesse o Firebase Console:
   - https://console.firebase.google.com/
   - Selecione o projeto: `minerx-app-login`

2. Vá para Functions:
   - Menu lateral → **Functions**
   - Clique na aba **Configuração** (ou **Configuration**)

3. Configure a variável de ambiente:
   - Na seção **Environment variables**, clique em **Add variable**
   - **Nome**: `KIWIFY_SECRET_KEY`
   - **Valor**: `3ienivdzi7c`
   - Clique em **Save**

4. Faça o deploy novamente:
   ```bash
   cd backend/functions
   firebase deploy --only functions:kiwifyWebhook
   ```

### Método 2: Firebase CLI (Alternativa)

```bash
# Certifique-se de estar no projeto correto
firebase use minerx-app-login

# Configure a variável de ambiente (Firebase Functions v2)
firebase functions:config:set kiwify.secret_key="3ienivdzi7c"

# Faça o deploy
cd backend/functions
firebase deploy --only functions:kiwifyWebhook
```

**Nota**: Para Firebase Functions v2, as variáveis de ambiente são definidas de forma diferente. O método mais confiável é via Firebase Console.

## Verificação

Após configurar, você pode verificar se está funcionando:

1. Veja os logs:
   ```bash
   firebase functions:log --only kiwifyWebhook --limit 5
   ```

2. Teste com o script de simulação:
   ```bash
   cd kiwify-simulate
   python simulate_webhook.py approved --email teste@example.com --plan STARTER --secret-key 3ienivdzi7c
   ```

## Importante

- A chave secreta `3ienivdzi7c` foi fornecida pela Kiwify
- A variável de ambiente deve estar configurada como `KIWIFY_SECRET_KEY` (ou `KIWIFY_WEBHOOK_TOKEN` para compatibilidade)
- Após configurar, **sempre faça o deploy novamente** para que as mudanças tenham efeito

## Troubleshooting

Se após configurar ainda aparecer o erro:

1. Verifique se fez o deploy após configurar:
   ```bash
   firebase deploy --only functions:kiwifyWebhook
   ```

2. Verifique se a variável está configurada corretamente:
   - No Firebase Console → Functions → Configuração
   - Deve aparecer: `KIWIFY_SECRET_KEY = 3ienivdzi7c`

3. Veja os logs para mais detalhes:
   ```bash
   firebase functions:log --only kiwifyWebhook --follow
   ```

