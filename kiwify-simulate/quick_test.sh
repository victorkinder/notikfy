#!/bin/bash
# Script auxiliar para testes rápidos
# Uso: ./quick_test.sh <email> <secret-key>

EMAIL=${1:-"teste@example.com"}
SECRET_KEY=${2:-"3ienivdzi7c"}
URL=${3:-"https://us-central1-minerx-app-login.cloudfunctions.net/kiwifyWebhook"}

echo "🧪 Testando webhook Kiwify"
echo "📧 Email: $EMAIL"
echo "🔗 URL: $URL"
echo ""

echo "1️⃣  Testando order_approved (STARTER)..."
python simulate_webhook.py approved --email "$EMAIL" --plan STARTER --secret-key "$SECRET_KEY" --url "$URL"

echo ""
echo "2️⃣  Testando order_approved (SCALING)..."
python simulate_webhook.py approved --email "$EMAIL" --plan SCALING --secret-key "$SECRET_KEY" --url "$URL"

echo ""
echo "3️⃣  Testando subscription_renewed..."
python simulate_webhook.py renewed --email "$EMAIL" --secret-key "$SECRET_KEY" --url "$URL"

echo ""
echo "4️⃣  Testando subscription_canceled..."
python simulate_webhook.py canceled --email "$EMAIL" --secret-key "$SECRET_KEY" --url "$URL"

echo ""
echo "5️⃣  Testando chargeback..."
python simulate_webhook.py chargeback --email "$EMAIL" --secret-key "$SECRET_KEY" --url "$URL"

echo ""
echo "✅ Testes concluídos!"

