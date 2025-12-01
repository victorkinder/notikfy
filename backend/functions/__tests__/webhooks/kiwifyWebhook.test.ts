/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-nocheck
import { Request, Response } from "express";
import { kiwifyWebhook } from "../../src/webhooks/kiwifyWebhook";
import {
  createSignature,
  updateSignatureStatus,
} from "../../src/services/signature.service";
import { sendActivationEmail } from "../../src/services/email.service";
import { revokeUserTokens } from "../../src/services/auth.service";

jest.mock("../../src/services/signature.service");
jest.mock("../../src/services/email.service");
jest.mock("../../src/services/auth.service");

describe("kiwifyWebhook", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.KIWIFY_WEBHOOK_TOKEN = "test-token";

    mockJson = jest.fn().mockReturnThis();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };

    mockRequest = {
      method: "POST",
      headers: {
        authorization: "Bearer test-token",
      },
      body: {},
    };
  });

  it("deve processar evento order_approved com sucesso", async () => {
    const mockSignature = {
      email: "test@example.com",
      access_token: "TEST123",
      plan: { id: "STARTER", name: "Iniciante" },
    };

    (createSignature as jest.Mock).mockResolvedValue(mockSignature);
    (sendActivationEmail as jest.Mock).mockResolvedValue(undefined);

    mockRequest.body = {
      webhook_event_type: "order_approved",
      order_id: "order123",
      order_status: "paid",
      Customer: {
        email: "test@example.com",
        full_name: "John Doe",
      },
      Product: {
        product_id: "product123",
        product_name: "Plano Iniciante",
      },
    };

    await kiwifyWebhook(mockRequest as Request, mockResponse as Response);

    expect(createSignature).toHaveBeenCalled();
    expect(sendActivationEmail).toHaveBeenCalledWith(
      "test@example.com",
      "TEST123",
      "Iniciante"
    );
    expect(mockStatus).toHaveBeenCalledWith(200);
  });

  it("deve processar evento subscription_canceled", async () => {
    (updateSignatureStatus as jest.Mock).mockResolvedValue({});
    (revokeUserTokens as jest.Mock).mockResolvedValue(undefined);

    mockRequest.body = {
      webhook_event_type: "subscription_canceled",
      order_id: "order123",
      order_status: "refunded",
      Customer: {
        email: "test@example.com",
        full_name: "John Doe",
      },
      subscription_id: "sub123",
    };

    await kiwifyWebhook(mockRequest as Request, mockResponse as Response);

    expect(updateSignatureStatus).toHaveBeenCalledWith(
      "test@example.com",
      "cancelled"
    );
    expect(revokeUserTokens).toHaveBeenCalledWith("test@example.com");
  });

  it("deve processar evento chargeback", async () => {
    (updateSignatureStatus as jest.Mock).mockResolvedValue({});
    (revokeUserTokens as jest.Mock).mockResolvedValue(undefined);

    mockRequest.body = {
      webhook_event_type: "chargeback",
      order_id: "order123",
      order_status: "chargedback",
      Customer: {
        email: "test@example.com",
        full_name: "John Doe",
      },
      subscription_id: "sub123",
    };

    await kiwifyWebhook(mockRequest as Request, mockResponse as Response);

    expect(updateSignatureStatus).toHaveBeenCalledWith(
      "test@example.com",
      "refunded"
    );
    expect(revokeUserTokens).toHaveBeenCalledWith("test@example.com");
  });

  it("deve processar evento subscription_renewed", async () => {
    (updateSignatureStatus as jest.Mock).mockResolvedValue({});

    mockRequest.body = {
      webhook_event_type: "subscription_renewed",
      order_id: "order123",
      order_status: "paid",
      Customer: {
        email: "test@example.com",
        full_name: "John Doe",
      },
      subscription_id: "sub123",
    };

    await kiwifyWebhook(mockRequest as Request, mockResponse as Response);

    expect(updateSignatureStatus).toHaveBeenCalledWith(
      "test@example.com",
      "active"
    );
    expect(revokeUserTokens).not.toHaveBeenCalled();
  });

  it("deve retornar erro 401 para token inválido", async () => {
    mockRequest.headers = {
      authorization: "Bearer wrong-token",
    };

    await kiwifyWebhook(mockRequest as Request, mockResponse as Response);

    expect(mockStatus).toHaveBeenCalledWith(401);
  });
});
