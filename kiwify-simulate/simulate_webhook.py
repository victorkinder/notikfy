#!/usr/bin/env python3
"""
Script para simular eventos de webhook da Kiwify
Permite testar os eventos order_approved, subscription_renewed, subscription_canceled e chargeback
"""

import json
import sys
import argparse
import uuid
import hmac
import hashlib
import requests
from datetime import datetime
from typing import Dict, Any, Optional
from enum import Enum
from urllib.parse import urlencode, urlparse, urlunparse, parse_qs


class EventType(Enum):
    """Tipos de eventos suportados (formato real da Kiwify)"""
    ORDER_APPROVED = "order_approved"
    SUBSCRIPTION_RENEWED = "subscription_renewed"
    SUBSCRIPTION_CANCELED = "subscription_canceled"
    CHARGEBACK = "chargeback"


# Mapeamento de planos
PLAN_MAPPING = {
    "STARTER": {
        "name": "Iniciante",
        "product_id": "kiwify-product-starter-id",
    },
    "SCALING": {
        "name": "Escalando",
        "product_id": "kiwify-product-scaling-id",
    },
    "SCALED": {
        "name": "Escalado",
        "product_id": "kiwify-product-scaled-id",
    },
}


def generate_order_id() -> str:
    """Gera um ID de pedido simulado no formato UUID"""
    return str(uuid.uuid4())


def generate_customer_id() -> str:
    """Gera um ID de cliente simulado no formato UUID"""
    return str(uuid.uuid4())


def create_order_approved_payload(
    email: str,
    plan_id: str = "STARTER",
    order_id: Optional[str] = None,
    customer_id: Optional[str] = None,
    product_id: Optional[str] = None,
    product_name: Optional[str] = None,
    amount: Optional[float] = None,
    subscription_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Cria payload para evento order_approved (formato real da Kiwify)
    
    Args:
        email: Email do cliente
        plan_id: ID do plano (STARTER, SCALING, SCALED)
        order_id: ID do pedido (opcional, será gerado se não fornecido)
        customer_id: ID do cliente (opcional, será gerado se não fornecido)
        product_id: ID do produto na Kiwify (opcional)
        product_name: Nome do produto (opcional)
        amount: Valor do pedido em centavos (opcional, será convertido)
        subscription_id: ID da assinatura (opcional)
    """
    plan = PLAN_MAPPING.get(plan_id, PLAN_MAPPING["STARTER"])
    
    # Valores padrão para preços em centavos
    prices_cents = {
        "STARTER": 4700,
        "SCALING": 6700,
        "SCALED": 9700,
    }
    
    amount_cents = int((amount * 100) if amount else prices_cents.get(plan_id, 4700))
    order_id_val = order_id or generate_order_id()
    customer_id_val = customer_id or generate_customer_id()
    subscription_id_val = subscription_id or str(uuid.uuid4())
    product_id_val = product_id or plan["product_id"]
    
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    iso_now = datetime.now().isoformat() + "Z"
    
    return {
        "order_id": order_id_val,
        "order_ref": f"REF{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "order_status": "paid",
        "product_type": "membership",
        "payment_method": "credit_card",
        "store_id": "test_store_id",
        "payment_merchant_id": 12345678,
        "installments": 1,
        "card_type": "mastercard",
        "card_last4digits": "1234",
        "card_rejection_reason": None,
        "boleto_URL": None,
        "boleto_barcode": None,
        "boleto_expiry_date": None,
        "pix_code": None,
        "pix_expiration": None,
        "sale_type": "producer",
        "created_at": now_str,
        "updated_at": now_str,
        "approved_date": now_str,
        "refunded_at": None,
        "webhook_event_type": EventType.ORDER_APPROVED.value,
        "Product": {
            "product_id": product_id_val,
            "product_name": product_name or plan["name"],
        },
        "Customer": {
            "full_name": email.split("@")[0].title(),
            "first_name": email.split("@")[0].split(".")[0].title(),
            "email": email,
            "mobile": "+5511999999999",
            "cnpj": None,
            "ip": "192.168.1.1",
            "instagram": None,
            "street": None,
            "number": None,
            "complement": None,
            "neighborhood": None,
            "city": None,
            "state": None,
            "zipcode": None,
        },
        "Commissions": {
            "charge_amount": amount_cents,
            "product_base_price": amount_cents,
            "product_base_price_currency": "BRL",
            "kiwify_fee": int(amount_cents * 0.11),
            "kiwify_fee_currency": "BRL",
            "settlement_amount": amount_cents,
            "settlement_amount_currency": "BRL",
            "sale_tax_rate": 0,
            "sale_tax_amount": 0,
            "currency": "BRL",
            "my_commission": int(amount_cents * 0.89),
        },
        "TrackingParameters": {},
        "Subscription": {
            "id": subscription_id_val,
            "start_date": iso_now,
            "next_payment": iso_now,
            "status": "active",
            "plan": {
                "id": str(uuid.uuid4()),
                "name": plan["name"],
                "frequency": "monthly",
                "qty_charges": 0,
            },
            "charges": {
                "completed": [
                    {
                        "order_id": order_id_val,
                        "amount": amount_cents,
                        "status": "paid",
                        "installments": 1,
                        "card_type": "mastercard",
                        "card_last_digits": "1234",
                        "card_first_digits": "123456",
                        "created_at": iso_now,
                    }
                ],
                "future": [],
            },
        },
        "subscription_id": subscription_id_val,
        "access_url": None,
    }


def create_subscription_canceled_payload(
    email: str,
    order_id: Optional[str] = None,
    customer_id: Optional[str] = None,
    subscription_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Cria payload para evento subscription_canceled (formato real da Kiwify)
    
    Args:
        email: Email do cliente
        order_id: ID do pedido (opcional)
        customer_id: ID do cliente (opcional)
        subscription_id: ID da assinatura (opcional)
    """
    order_id_val = order_id or generate_order_id()
    customer_id_val = customer_id or generate_customer_id()
    subscription_id_val = subscription_id or str(uuid.uuid4())
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    iso_now = datetime.now().isoformat() + "Z"
    
    return {
        "order_id": order_id_val,
        "order_ref": f"REF{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "order_status": "refunded",
        "product_type": "membership",
        "payment_method": "credit_card",
        "store_id": "test_store_id",
        "payment_merchant_id": 12345678,
        "installments": 1,
        "card_type": "mastercard",
        "card_last4digits": "1234",
        "card_rejection_reason": None,
        "boleto_URL": None,
        "boleto_barcode": None,
        "boleto_expiry_date": None,
        "pix_code": None,
        "pix_expiration": None,
        "sale_type": "producer",
        "created_at": now_str,
        "updated_at": now_str,
        "approved_date": None,
        "refunded_at": now_str,
        "webhook_event_type": EventType.SUBSCRIPTION_CANCELED.value,
        "Product": {
            "product_id": str(uuid.uuid4()),
            "product_name": "Example product",
        },
        "Customer": {
            "full_name": email.split("@")[0].title(),
            "first_name": email.split("@")[0].split(".")[0].title(),
            "email": email,
            "mobile": "+5511999999999",
        },
        "Commissions": {
            "charge_amount": 0,
            "currency": "BRL",
        },
        "TrackingParameters": {},
        "Subscription": {
            "id": subscription_id_val,
            "start_date": iso_now,
            "next_payment": iso_now,
            "status": "canceled",
            "plan": {
                "id": str(uuid.uuid4()),
                "name": "Example plan",
                "frequency": "monthly",
                "qty_charges": 0,
            },
            "charges": {
                "completed": [],
                "future": [
                    {
                        "charge_date": iso_now,
                    }
                ],
            },
        },
        "subscription_id": subscription_id_val,
    }


def create_subscription_renewed_payload(
    email: str,
    order_id: Optional[str] = None,
    customer_id: Optional[str] = None,
    subscription_id: Optional[str] = None,
    amount: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Cria payload para evento subscription_renewed (formato real da Kiwify)
    
    Args:
        email: Email do cliente
        order_id: ID do pedido (opcional)
        customer_id: ID do cliente (opcional)
        subscription_id: ID da assinatura (opcional)
        amount: Valor do pedido em reais (opcional, será convertido para centavos)
    """
    order_id_val = order_id or generate_order_id()
    customer_id_val = customer_id or generate_customer_id()
    subscription_id_val = subscription_id or str(uuid.uuid4())
    amount_cents = int((amount * 100) if amount else 4700)
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    iso_now = datetime.now().isoformat() + "Z"
    
    return {
        "order_id": order_id_val,
        "order_ref": f"REF{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "order_status": "paid",
        "product_type": "membership",
        "payment_method": "credit_card",
        "store_id": "test_store_id",
        "payment_merchant_id": 12345678,
        "installments": 1,
        "card_type": "mastercard",
        "card_last4digits": "1234",
        "card_rejection_reason": None,
        "boleto_URL": None,
        "boleto_barcode": None,
        "boleto_expiry_date": None,
        "pix_code": None,
        "pix_expiration": None,
        "sale_type": "producer",
        "created_at": now_str,
        "updated_at": now_str,
        "approved_date": None,
        "refunded_at": None,
        "webhook_event_type": EventType.SUBSCRIPTION_RENEWED.value,
        "Product": {
            "product_id": str(uuid.uuid4()),
            "product_name": "Example product",
        },
        "Customer": {
            "full_name": email.split("@")[0].title(),
            "first_name": email.split("@")[0].split(".")[0].title(),
            "email": email,
            "mobile": "+5511999999999",
        },
        "Commissions": {
            "charge_amount": amount_cents,
            "product_base_price": amount_cents,
            "product_base_price_currency": "BRL",
            "kiwify_fee": int(amount_cents * 0.11),
            "currency": "BRL",
            "my_commission": int(amount_cents * 0.89),
        },
        "TrackingParameters": {},
        "Subscription": {
            "id": subscription_id_val,
            "start_date": iso_now,
            "next_payment": iso_now,
            "status": "active",
            "plan": {
                "id": str(uuid.uuid4()),
                "name": "Example plan",
                "frequency": "monthly",
                "qty_charges": 0,
            },
            "charges": {
                "completed": [
                    {
                        "order_id": order_id_val,
                        "amount": amount_cents,
                        "status": "paid",
                        "installments": 1,
                        "card_type": "mastercard",
                        "card_last_digits": "1234",
                        "card_first_digits": "123456",
                        "created_at": iso_now,
                    }
                ],
                "future": [
                    {
                        "charge_date": iso_now,
                    }
                ],
            },
        },
        "subscription_id": subscription_id_val,
    }


def create_chargeback_payload(
    email: str,
    order_id: Optional[str] = None,
    customer_id: Optional[str] = None,
    subscription_id: Optional[str] = None,
    amount: Optional[float] = None,
) -> Dict[str, Any]:
    """
    Cria payload para evento chargeback (formato real da Kiwify)
    
    Args:
        email: Email do cliente
        order_id: ID do pedido (opcional)
        customer_id: ID do cliente (opcional)
        subscription_id: ID da assinatura (opcional)
        amount: Valor do pedido em reais (opcional, será convertido para centavos)
    """
    order_id_val = order_id or generate_order_id()
    customer_id_val = customer_id or generate_customer_id()
    subscription_id_val = subscription_id or str(uuid.uuid4())
    amount_cents = int((amount * 100) if amount else 4700)
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M")
    iso_now = datetime.now().isoformat() + "Z"
    
    return {
        "order_id": order_id_val,
        "order_ref": f"REF{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "order_status": "chargedback",
        "product_type": "membership",
        "payment_method": "credit_card",
        "store_id": "test_store_id",
        "payment_merchant_id": 12345678,
        "installments": 1,
        "card_type": "mastercard",
        "card_last4digits": "1234",
        "card_rejection_reason": None,
        "boleto_URL": None,
        "boleto_barcode": None,
        "boleto_expiry_date": None,
        "pix_code": None,
        "pix_expiration": None,
        "sale_type": "producer",
        "created_at": now_str,
        "updated_at": now_str,
        "approved_date": None,
        "refunded_at": None,
        "webhook_event_type": EventType.CHARGEBACK.value,
        "Product": {
            "product_id": str(uuid.uuid4()),
            "product_name": "Example product",
        },
        "Customer": {
            "full_name": email.split("@")[0].title(),
            "first_name": email.split("@")[0].split(".")[0].title(),
            "email": email,
            "mobile": "+5511999999999",
        },
        "Commissions": {
            "charge_amount": amount_cents,
            "product_base_price": amount_cents,
            "currency": "BRL",
        },
        "TrackingParameters": {},
        "Subscription": {
            "id": subscription_id_val,
            "start_date": iso_now,
            "next_payment": iso_now,
            "status": "active",
            "plan": {
                "id": str(uuid.uuid4()),
                "name": "Example plan",
                "frequency": "monthly",
                "qty_charges": 0,
            },
            "charges": {
                "completed": [
                    {
                        "order_id": order_id_val,
                        "amount": amount_cents,
                        "status": "paid",
                        "installments": 1,
                        "card_type": "mastercard",
                        "card_last_digits": "1234",
                        "created_at": iso_now,
                    }
                ],
                "future": [
                    {
                        "charge_date": iso_now,
                    }
                ],
            },
        },
        "subscription_id": subscription_id_val,
    }


def calculate_signature(payload: Dict[str, Any], secret_key: str) -> str:
    """
    Calcula a assinatura HMAC SHA1 do payload
    
    Args:
        payload: Payload JSON
        secret_key: Chave secreta da Kiwify
    
    Returns:
        Assinatura hexadecimal
    """
    payload_json = json.dumps(payload, separators=(',', ':'), ensure_ascii=False)
    signature = hmac.new(
        secret_key.encode('utf-8'),
        payload_json.encode('utf-8'),
        hashlib.sha1
    ).hexdigest()
    return signature


def send_webhook(
    url: str,
    payload: Dict[str, Any],
    secret_key: str,
) -> requests.Response:
    """
    Envia webhook para o endpoint especificado com assinatura HMAC
    
    Args:
        url: URL do endpoint do webhook
        payload: Payload JSON a ser enviado
        secret_key: Chave secreta da Kiwify para calcular a assinatura
    
    Returns:
        Response da requisição HTTP
    """
    # Calcula a assinatura HMAC SHA1
    signature = calculate_signature(payload, secret_key)
    
    # Adiciona a assinatura como query parameter
    parsed_url = urlparse(url)
    query_params = parse_qs(parsed_url.query)
    query_params['signature'] = signature
    new_query = urlencode(query_params, doseq=True)
    signed_url = urlunparse((
        parsed_url.scheme,
        parsed_url.netloc,
        parsed_url.path,
        parsed_url.params,
        new_query,
        parsed_url.fragment
    ))
    
    headers = {
        "Content-Type": "application/json",
    }
    
    print(f"\n📤 Enviando webhook para: {url}")
    print(f"🔑 Chave secreta: {secret_key[:10]}...")
    print(f"✍️  Assinatura: {signature[:20]}...")
    print(f"📋 Evento: {payload.get('webhook_event_type')}")
    customer_email = payload.get('Customer', {}).get('email', 'N/A')
    print(f"📧 Email: {customer_email}")
    print(f"\n📦 Payload:")
    print(json.dumps(payload, indent=2, ensure_ascii=False))
    
    try:
        response = requests.post(signed_url, json=payload, headers=headers, timeout=30)
        
        print(f"\n✅ Status Code: {response.status_code}")
        print(f"📄 Response:")
        try:
            response_json = response.json()
            print(json.dumps(response_json, indent=2, ensure_ascii=False))
        except ValueError:
            print(response.text)
        
        return response
    except requests.exceptions.RequestException as e:
        print(f"\n❌ Erro ao enviar webhook: {e}")
        raise


def main():
    """Função principal"""
    parser = argparse.ArgumentParser(
        description="Simula eventos de webhook da Kiwify",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Exemplos:
  # Simular compra aprovada do plano Iniciante
  python simulate_webhook.py approved --email usuario@example.com --plan STARTER

  # Simular renovação de assinatura
  python simulate_webhook.py renewed --email usuario@example.com

  # Simular cancelamento de assinatura
  python simulate_webhook.py canceled --email usuario@example.com

  # Simular chargeback
  python simulate_webhook.py chargeback --email usuario@example.com

  # Usar URL e chave secreta customizados
  python simulate_webhook.py approved --email usuario@example.com \\
    --url https://us-central1-minerx-app-login.cloudfunctions.net/kiwifyWebhook \\
    --secret-key 3ienivdzi7c
        """,
    )
    
    subparsers = parser.add_subparsers(dest="event", help="Tipo de evento", required=True)
    
    # Parser para order_approved
    approved_parser = subparsers.add_parser("approved", help="Simular evento order_approved (compra aprovada)")
    approved_parser.add_argument("--email", required=True, help="Email do cliente")
    approved_parser.add_argument("--plan", choices=["STARTER", "SCALING", "SCALED"], 
                                 default="STARTER", help="ID do plano (default: STARTER)")
    approved_parser.add_argument("--order-id", help="ID do pedido (opcional)")
    approved_parser.add_argument("--customer-id", help="ID do cliente (opcional)")
    approved_parser.add_argument("--product-id", help="ID do produto na Kiwify (opcional)")
    approved_parser.add_argument("--product-name", help="Nome do produto (opcional)")
    approved_parser.add_argument("--amount", type=float, help="Valor do pedido em reais (opcional)")
    approved_parser.add_argument("--subscription-id", help="ID da assinatura (opcional)")
    
    # Parser para subscription_renewed
    renewed_parser = subparsers.add_parser("renewed", help="Simular evento subscription_renewed (renovação)")
    renewed_parser.add_argument("--email", required=True, help="Email do cliente")
    renewed_parser.add_argument("--order-id", help="ID do pedido (opcional)")
    renewed_parser.add_argument("--customer-id", help="ID do cliente (opcional)")
    renewed_parser.add_argument("--subscription-id", help="ID da assinatura (opcional)")
    renewed_parser.add_argument("--amount", type=float, help="Valor do pedido em reais (opcional)")
    
    # Parser para subscription_canceled
    canceled_parser = subparsers.add_parser("canceled", help="Simular evento subscription_canceled (cancelamento)")
    canceled_parser.add_argument("--email", required=True, help="Email do cliente")
    canceled_parser.add_argument("--order-id", help="ID do pedido (opcional)")
    canceled_parser.add_argument("--customer-id", help="ID do cliente (opcional)")
    canceled_parser.add_argument("--subscription-id", help="ID da assinatura (opcional)")
    
    # Parser para chargeback
    chargeback_parser = subparsers.add_parser("chargeback", help="Simular evento chargeback")
    chargeback_parser.add_argument("--email", required=True, help="Email do cliente")
    chargeback_parser.add_argument("--order-id", help="ID do pedido (opcional)")
    chargeback_parser.add_argument("--customer-id", help="ID do cliente (opcional)")
    chargeback_parser.add_argument("--subscription-id", help="ID da assinatura (opcional)")
    chargeback_parser.add_argument("--amount", type=float, help="Valor do pedido em reais (opcional)")
    
    # Argumentos comuns
    for p in [approved_parser, renewed_parser, canceled_parser, chargeback_parser]:
        p.add_argument("--url", help="URL do webhook (default: https://us-central1-minerx-app-login.cloudfunctions.net/kiwifyWebhook)")
        p.add_argument("--secret-key", required=True, help="Chave secreta da Kiwify para calcular a assinatura HMAC")
    
    args = parser.parse_args()
    
    # URL padrão
    url = args.url or "https://us-central1-minerx-app-login.cloudfunctions.net/kiwifyWebhook"
    
    # Gera payload baseado no tipo de evento
    if args.event == "approved":
        payload = create_order_approved_payload(
            email=args.email,
            plan_id=getattr(args, "plan", "STARTER"),
            order_id=getattr(args, "order_id", None),
            customer_id=getattr(args, "customer_id", None),
            product_id=getattr(args, "product_id", None),
            product_name=getattr(args, "product_name", None),
            amount=getattr(args, "amount", None),
            subscription_id=getattr(args, "subscription_id", None),
        )
    elif args.event == "renewed":
        payload = create_subscription_renewed_payload(
            email=args.email,
            order_id=getattr(args, "order_id", None),
            customer_id=getattr(args, "customer_id", None),
            subscription_id=getattr(args, "subscription_id", None),
            amount=getattr(args, "amount", None),
        )
    elif args.event == "canceled":
        payload = create_subscription_canceled_payload(
            email=args.email,
            order_id=getattr(args, "order_id", None),
            customer_id=getattr(args, "customer_id", None),
            subscription_id=getattr(args, "subscription_id", None),
        )
    elif args.event == "chargeback":
        payload = create_chargeback_payload(
            email=args.email,
            order_id=getattr(args, "order_id", None),
            customer_id=getattr(args, "customer_id", None),
            subscription_id=getattr(args, "subscription_id", None),
            amount=getattr(args, "amount", None),
        )
    else:
        print(f"❌ Tipo de evento inválido: {args.event}")
        sys.exit(1)
    
    # Envia webhook
    try:
        secret_key = getattr(args, "secret_key", None)
        if not secret_key:
            print("❌ Chave secreta não fornecida. Use --secret-key")
            sys.exit(1)
        
        response = send_webhook(
            url=url,
            payload=payload,
            secret_key=secret_key,
        )
        
        if response.status_code == 200:
            print("\n✅ Webhook enviado com sucesso!")
            sys.exit(0)
        else:
            print(f"\n⚠️  Webhook retornou status {response.status_code}")
            sys.exit(1)
    except Exception as e:
        print(f"\n❌ Erro: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

