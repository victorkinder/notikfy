@echo off
REM Script auxiliar para testes rápidos no Windows
REM Uso: quick_test.bat <email> <secret-key> [url]

set EMAIL=%~1
if "%EMAIL%"=="" set EMAIL=teste@example.com

set SECRET_KEY=%~2
if "%SECRET_KEY%"=="" set SECRET_KEY=3ienivdzi7c

set URL=%~3
if "%URL%"=="" set URL=https://us-central1-minerx-app-login.cloudfunctions.net/kiwifyWebhook

echo 🧪 Testando webhook Kiwify
echo 📧 Email: %EMAIL%
echo 🔗 URL: %URL%
echo.

echo 1️⃣  Testando order_approved (STARTER)...
python simulate_webhook.py approved --email "%EMAIL%" --plan STARTER --secret-key "%SECRET_KEY%" --url "%URL%"

echo.
echo 2️⃣  Testando order_approved (SCALING)...
python simulate_webhook.py approved --email "%EMAIL%" --plan SCALING --secret-key "%SECRET_KEY%" --url "%URL%"

echo.
echo 3️⃣  Testando subscription_renewed...
python simulate_webhook.py renewed --email "%EMAIL%" --secret-key "%SECRET_KEY%" --url "%URL%"

echo.
echo 4️⃣  Testando subscription_canceled...
python simulate_webhook.py canceled --email "%EMAIL%" --secret-key "%SECRET_KEY%" --url "%URL%"

echo.
echo 5️⃣  Testando chargeback...
python simulate_webhook.py chargeback --email "%EMAIL%" --secret-key "%SECRET_KEY%" --url "%URL%"

echo.
echo ✅ Testes concluídos!

