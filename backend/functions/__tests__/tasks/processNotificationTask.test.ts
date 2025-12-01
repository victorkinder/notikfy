import { Request, Response } from "express";
import { processNotificationTask } from "../../src/tasks/processNotificationTask";
import {
  sendSaleNotification,
  sendAccumulatedCommissionNotification,
} from "../../src/services/notification.service";

jest.mock("../../src/services/notification.service");
jest.mock("../../src/utils/logger", () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

const mockSendSaleNotification = sendSaleNotification as jest.MockedFunction<
  typeof sendSaleNotification
>;
const mockSendAccumulatedCommissionNotification =
  sendAccumulatedCommissionNotification as jest.MockedFunction<
    typeof sendAccumulatedCommissionNotification
  >;

describe("processNotificationTask Cloud Function", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    jest.clearAllMocks();
    originalEnv = { ...process.env };
    process.env.NODE_ENV = "test";

    mockRequest = {
      method: "POST",
      headers: {
        "x-cloudtasks-queuename": "notification-queue",
        "x-cloudtasks-taskname": "task-123",
      },
      body: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe("Notificação de venda", () => {
    it("deve processar notificação de venda com sucesso", async () => {
      mockRequest.body = {
        type: "sale",
        userId: "user-123",
        saleData: {
          productName: "Produto Teste",
          amount: 100,
          currency: "BRL",
          orderId: "order-123",
        },
      };

      mockSendSaleNotification.mockResolvedValue();

      await processNotificationTask(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockSendSaleNotification).toHaveBeenCalledWith("user-123", {
        productName: "Produto Teste",
        amount: 100,
        currency: "BRL",
        orderId: "order-123",
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: true,
        message: "Notificação processada com sucesso",
      });
    });
  });

  describe("Notificação de comissão acumulada", () => {
    it("deve processar notificação de comissão acumulada com sucesso", async () => {
      mockRequest.body = {
        type: "accumulated_commission",
        userId: "user-123",
        accumulatedAmount: 500,
        threshold: 250,
      };

      mockSendAccumulatedCommissionNotification.mockResolvedValue();

      await processNotificationTask(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockSendAccumulatedCommissionNotification).toHaveBeenCalledWith(
        "user-123",
        500,
        250
      );
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });

  describe("Validações", () => {
    it("deve rejeitar método diferente de POST", async () => {
      mockRequest.method = "GET";

      await processNotificationTask(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(405);
      expect(mockResponse.json).toHaveBeenCalledWith({
        success: false,
        error: "MethodNotAllowed",
        message: "Método não permitido. Use POST.",
      });
    });

    it("deve rejeitar payload sem type", async () => {
      mockRequest.body = {
        userId: "user-123",
        saleData: {},
      };

      await processNotificationTask(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: "ValidationError",
        })
      );
    });

    it("deve rejeitar payload sem userId", async () => {
      mockRequest.body = {
        type: "sale",
        saleData: {},
      };

      await processNotificationTask(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it("deve rejeitar tipo de notificação inválido", async () => {
      mockRequest.body = {
        type: "invalid_type",
        userId: "user-123",
      };

      await processNotificationTask(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it("deve rejeitar notificação de venda sem saleData", async () => {
      mockRequest.body = {
        type: "sale",
        userId: "user-123",
      };

      await processNotificationTask(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it("deve rejeitar notificação de comissão sem accumulatedAmount e threshold", async () => {
      mockRequest.body = {
        type: "accumulated_commission",
        userId: "user-123",
      };

      await processNotificationTask(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe("Tratamento de erros", () => {
    it("deve tratar erro ao enviar notificação", async () => {
      mockRequest.body = {
        type: "sale",
        userId: "user-123",
        saleData: {
          productName: "Produto Teste",
          amount: 100,
          currency: "BRL",
          orderId: "order-123",
        },
      };

      const error = new Error("Erro ao enviar notificação");
      mockSendSaleNotification.mockRejectedValue(error);

      await processNotificationTask(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
        })
      );
    });

    it("deve processar body como string JSON", async () => {
      mockRequest.body = JSON.stringify({
        type: "sale",
        userId: "user-123",
        saleData: {
          productName: "Produto Teste",
          amount: 100,
          currency: "BRL",
          orderId: "order-123",
        },
      });

      mockSendSaleNotification.mockResolvedValue();

      await processNotificationTask(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockSendSaleNotification).toHaveBeenCalled();
      expect(mockResponse.status).toHaveBeenCalledWith(200);
    });
  });
});

