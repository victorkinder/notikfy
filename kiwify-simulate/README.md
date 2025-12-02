# Simulador de Webhooks Kiwify

Script Python para simular eventos de webhook da Kiwify, útil para testar a integração sem precisar fazer compras reais.

## Instalação

```bash
pip install -r requirements.txt
```

## Uso

### Simular compra aprovada (order_approved)

```bash
python simulate_webhook.py approved \
  --email usuario@example.com \
  --plan STARTER \
  --secret-key 3ienivdzi7c
```

**Opções disponíveis:**
- `--email` (obrigatório): Email do cliente
- `--plan`: ID do plano (`STARTER`, `SCALING`, `SCALED`) - padrão: `STARTER`
- `--order-id`: ID do pedido (opcional, será gerado automaticamente)
- `--customer-id`: ID do cliente (opcional, será gerado automaticamente)
- `--product-id`: ID do produto na Kiwify (opcional)
- `--product-name`: Nome do produto (opcional)
- `--amount`: Valor do pedido em reais (opcional)
- `--subscription-id`: ID da assinatura (opcional)
- `--url`: URL do webhook (padrão: `https://us-central1-minerx-app-login.cloudfunctions.net/kiwifyWebhook`)
- `--secret-key` (obrigatório): Chave secreta da Kiwify para calcular a assinatura HMAC SHA1

### Simular renovação de assinatura (subscription_renewed)

```bash
python simulate_webhook.py renewed \
  --email usuario@example.com \
  --token seu-token-webhook
```

**Opções disponíveis:**
- `--email` (obrigatório): Email do cliente
- `--order-id`: ID do pedido (opcional)
- `--customer-id`: ID do cliente (opcional)
- `--subscription-id`: ID da assinatura (opcional)
- `--amount`: Valor do pedido em reais (opcional)
- `--url`: URL do webhook
- `--secret-key` (obrigatório): Chave secreta da Kiwify para calcular a assinatura HMAC SHA1

### Simular cancelamento de assinatura (subscription_canceled)

```bash
python simulate_webhook.py canceled \
  --email usuario@example.com \
  --token seu-token-webhook
```

**Opções disponíveis:**
- `--email` (obrigatório): Email do cliente
- `--order-id`: ID do pedido (opcional)
- `--customer-id`: ID do cliente (opcional)
- `--subscription-id`: ID da assinatura (opcional)
- `--url`: URL do webhook
- `--secret-key` (obrigatório): Chave secreta da Kiwify para calcular a assinatura HMAC SHA1

### Simular chargeback

```bash
python simulate_webhook.py chargeback \
  --email usuario@example.com \
  --token seu-token-webhook
```

**Opções disponíveis:**
- `--email` (obrigatório): Email do cliente
- `--order-id`: ID do pedido (opcional)
- `--customer-id`: ID do cliente (opcional)
- `--subscription-id`: ID da assinatura (opcional)
- `--amount`: Valor do pedido em reais (opcional)
- `--url`: URL do webhook
- `--secret-key` (obrigatório): Chave secreta da Kiwify para calcular a assinatura HMAC SHA1

## Exemplos

### Exemplo 1: Compra do plano Iniciante

```bash
python simulate_webhook.py approved \
  --email teste@example.com \
  --plan STARTER \
  --secret-key 3ienivdzi7c
```

### Exemplo 2: Compra do plano Escalando com valores customizados

```bash
python simulate_webhook.py approved \
  --email teste@example.com \
  --plan SCALING \
  --product-name "Plano Escalando - Kiwify" \
  --amount 67.00 \
  --secret-key 3ienivdzi7c
```

### Exemplo 3: Renovação de assinatura

```bash
python simulate_webhook.py renewed \
  --email usuario@example.com \
  --subscription-id sub_123456 \
  --secret-key 3ienivdzi7c
```

### Exemplo 4: Cancelamento de assinatura

```bash
python simulate_webhook.py canceled \
  --email usuario@example.com \
  --order-id order_123456 \
  --secret-key 3ienivdzi7c
```

### Exemplo 5: Chargeback

```bash
python simulate_webhook.py chargeback \
  --email usuario@example.com \
  --amount 47.00 \
  --secret-key 3ienivdzi7c
```

### Exemplo 6: Usar URL customizada (ex: ambiente local)

```bash
# Para testar localmente (se estiver rodando emuladores)
python simulate_webhook.py approved \
  --email teste@example.com \
  --plan SCALED \
  --url http://localhost:5001/minerx-app-login/us-central1/kiwifyWebhook \
  --token 3ienivdzi7c

# URL padrão já aponta para ambiente DEV na nuvem:
# https://us-central1-minerx-app-login.cloudfunctions.net/kiwifyWebhook
```

### Exemplo 7: Usar header X-Kiwify-Token

```bash
python simulate_webhook.py approved \
  --email teste@example.com \
  --secret-key 3ienivdzi7c
```

## Planos Disponíveis

- **STARTER** (Iniciante): R$ 47,00/mês - Até 5 contas
- **SCALING** (Escalando): R$ 67,00/mês - Até 10 contas
- **SCALED** (Escalado): R$ 117,00/mês - Mais de 10 contas

## Estrutura do Payload

O script gera payloads no formato real da Kiwify, compatível com a estrutura esperada pelo backend:

```json
{
  "webhook_event_type": "order_approved",
  "order_id": "e0a535b1-d0a9-4e71-84b8-90d5a5b08635",
  "order_ref": "kJPjUSz",
  "order_status": "paid",
  "product_type": "membership",
  "payment_method": "credit_card",
  "Customer": {
    "email": "usuario@example.com",
    "full_name": "Usuario",
    "first_name": "Usuario"
  },
  "Product": {
    "product_id": "65c656de-0c91-48f1-b2a0-5a0c22885dd1",
    "product_name": "Iniciante"
  },
  "Subscription": {
    "id": "57b95f1e-bdcf-4397-b621-089e5af3cec5",
    "status": "active",
    "plan": {
      "name": "Iniciante",
      "frequency": "monthly"
    }
  },
  "subscription_id": "57b95f1e-bdcf-4397-b621-089e5af3cec5"
}
```

**Nota:** O payload completo inclui muitos outros campos opcionais (comissões, tracking parameters, etc.) que são gerados automaticamente pelo script.

## Configuração da Chave Secreta

A chave secreta da Kiwify é: `3ienivdzi7c`

Esta chave secreta deve ser configurada no backend na variável de ambiente `KIWIFY_SECRET_KEY` ou `KIWIFY_WEBHOOK_TOKEN` e é usada para:

1. **Calcular a assinatura HMAC SHA1** do payload JSON
2. **Validar a assinatura** que vem no query parameter `signature`

O script de simulação calcula automaticamente a assinatura HMAC e a adiciona como query parameter:

```bash
python simulate_webhook.py approved \
  --email teste@example.com \
  --plan STARTER \
  --secret-key 3ienivdzi7c
```

**Como funciona a validação:**
- A Kiwify envia a assinatura no query parameter: `?signature=<hmac-signature>`
- O backend calcula a assinatura esperada usando HMAC SHA1 do payload JSON
- Compara as assinaturas para validar que o webhook veio realmente da Kiwify

## Notas

- Os IDs de pedido e cliente são gerados automaticamente se não fornecidos
- O script valida o email e formata o payload corretamente
- A assinatura HMAC SHA1 é calculada automaticamente pelo script
- O script exibe o payload completo antes de enviar para facilitar debug
- **Chave secreta da Kiwify:** `3ienivdzi7c` (fornecido pela Kiwify)

