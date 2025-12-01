import { Request, Response } from "express";
import { saleWebhook } from "../../src/webhooks/saleWebhook";
import { processSaleWithAccumulatedCommission } from "../../src/services/sale.service";
import {
  enqueueSaleNotification,
  enqueueAccumulatedCommissionNotification,
} from "../../src/services/taskQueue.service";

jest.mock("../../src/services/sale.service");
jest.mock("../../src/services/taskQueue.service");

const mockProcessSaleWithAccumulatedCommission =
  processSaleWithAccumulatedCommission as jest.MockedFunction<
    typeof processSaleWithAccumulatedCommission
  >;
const mockEnqueueSaleNotification = enqueueSaleNotification as jest.MockedFunction<
  typeof enqueueSaleNotification
>;
const mockEnqueueAccumulatedCommissionNotification =
  enqueueAccumulatedCommissionNotification as jest.MockedFunction<
    typeof enqueueAccumulatedCommissionNotification
  >;

describe("saleWebhook Cloud Function", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      method: "POST",
      headers: {
        "x-user-id": "test-user-id",
      },
      body: {
        orderId: "order-123",
        productName: "Produto Teste",
        amount: 100,
        currency: "BRL",
        commission: 50,
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  it("deve processar venda com tipo 'sale' e enfileirar notificação", async () => {
    mockProcessSaleWithAccumulatedCommission.mockResolvedValue({
      shouldNotify: false,
      newAccumulated: 0,
      notificationType: "sale",
      sale: {
        id: "sale-id",
        userId: "test-user-id",
        orderId: "order-123",
        productName: "Produto Teste",
        amount: 100,
        currency: "BRL",
        status: "completed",
        commission: 50,
        webhookData: {},
        notificationSent: false,
        createdAt: {} as any,
      },
    });

    mockEnqueueSaleNotification.mockResolvedValue("task-123");

    await saleWebhook(mockRequest as Request, mockResponse as Response);

    expect(mockProcessSaleWithAccumulatedCommission).toHaveBeenCalledWith(
      "test-user-id",
      expect.objectContaining({
        orderId: "order-123",
        productName: "Produto Teste",
        amount: 100,
        currency: "BRL",
        commission: 50,
      }),
      50
    );

    expect(mockEnqueueSaleNotification).toHaveBeenCalledWith(
      "test-user-id",
      expect.objectContaining({
        productName: "Produto Teste",
        amount: 100,
        currency: "BRL",
        orderId: "order-123",
      })
    );

    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });

  it("deve processar venda com tipo 'accumulated_commission' e enfileirar notificação quando threshold atingido", async () => {
    mockProcessSaleWithAccumulatedCommission.mockResolvedValue({
      shouldNotify: true,
      newAccumulated: 10,
      notificationType: "accumulated_commission",
      notificationData: {
        accumulatedAmount: 110,
        threshold: 100,
      },
      sale: {
        id: "sale-id",
        userId: "test-user-id",
        orderId: "order-123",
        productName: "Produto Teste",
        amount: 100,
        currency: "BRL",
        status: "completed",
        commission: 50,
        webhookData: {},
        notificationSent: true,
        createdAt: {} as any,
      },
    });

    mockEnqueueAccumulatedCommissionNotification.mockResolvedValue("task-456");

    await saleWebhook(mockRequest as Request, mockResponse as Response);

    expect(mockEnqueueAccumulatedCommissionNotification).toHaveBeenCalledWith(
      "test-user-id",
      110,
      100
    );

    expect(mockEnqueueSaleNotification).not.toHaveBeenCalled();
    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });

  it("deve extrair comissão do webhook quando não fornecida explicitamente", async () => {
    mockRequest.body = {
      orderId: "order-123",
      productName: "Produto Teste",
      amount: 100,
      currency: "BRL",
      Commissions: {
        my_commission: 75,
      },
    };

    mockProcessSaleWithAccumulatedCommission.mockResolvedValue({
      shouldNotify: false,
      newAccumulated: 75,
      notificationType: "accumulated_commission",
      sale: {
        id: "sale-id",
        userId: "test-user-id",
        orderId: "order-123",
        productName: "Produto Teste",
        amount: 100,
        currency: "BRL",
        status: "completed",
        commission: 75,
        webhookData: {},
        notificationSent: false,
        createdAt: {} as any,
      },
    });

    await saleWebhook(mockRequest as Request, mockResponse as Response);

    // Verifica que processSaleWithAccumulatedCommission foi chamado
    // A comissão será extraída automaticamente pelo extractCommissionFromWebhook
    expect(mockProcessSaleWithAccumulatedCommission).toHaveBeenCalled();
    const callArgs = mockProcessSaleWithAccumulatedCommission.mock.calls[0];
    expect(callArgs[2]).toBe(75); // Verifica que a comissão extraída é 75
  });

  it("deve retornar erro 405 para método não permitido", async () => {
    mockRequest.method = "GET";

    await saleWebhook(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(405);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: "MethodNotAllowed",
      message: "Método não permitido. Use POST.",
    });
  });

  it("deve retornar erro 400 quando orderId não fornecido", async () => {
    mockRequest.body = {
      productName: "Produto Teste",
      amount: 100,
    };

    await saleWebhook(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: "ValidationError",
      })
    );
  });

  it("deve retornar erro 400 quando userId não encontrado", async () => {
    mockRequest.headers = {};

    await saleWebhook(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: "ValidationError",
      })
    );
  });

  it("deve tratar erros internos e retornar 500", async () => {
    mockProcessSaleWithAccumulatedCommission.mockRejectedValue(
      new Error("Erro interno")
    );

    await saleWebhook(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
      })
    );
  });

  it("deve continuar processamento mesmo se enfileiramento falhar", async () => {
    mockProcessSaleWithAccumulatedCommission.mockResolvedValue({
      shouldNotify: false,
      newAccumulated: 0,
      notificationType: "sale",
      sale: {
        id: "sale-id",
        userId: "test-user-id",
        orderId: "order-123",
        productName: "Produto Teste",
        amount: 100,
        currency: "BRL",
        status: "completed",
        commission: 50,
        webhookData: {},
        notificationSent: false,
        createdAt: {} as any,
      },
    });

    mockEnqueueSaleNotification.mockRejectedValue(
      new Error("Erro ao enfileirar")
    );

    await saleWebhook(mockRequest as Request, mockResponse as Response);

    // Webhook deve responder com sucesso mesmo se enfileiramento falhar
    // A venda já foi processada com sucesso
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockEnqueueSaleNotification).toHaveBeenCalled();
  });
});

