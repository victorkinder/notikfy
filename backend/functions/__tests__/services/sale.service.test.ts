import {
  processSaleWithAccumulatedCommission,
  extractCommissionFromWebhook,
} from "../../src/services/sale.service";
import { db } from "../../src/config/firebase.config";
import { ValidationError, NotFoundError } from "../../src/utils/errors";

jest.mock("../../src/config/firebase.config", () => ({
  db: {
    collection: jest.fn(),
    runTransaction: jest.fn(),
  },
}));

describe("sale.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("extractCommissionFromWebhook", () => {
    it("deve extrair comissão do campo 'commission'", () => {
      const webhookData = { commission: 50 };
      const result = extractCommissionFromWebhook(webhookData);
      expect(result).toBe(50);
    });

    it("deve extrair comissão do campo 'my_commission'", () => {
      const webhookData = { my_commission: 100 };
      const result = extractCommissionFromWebhook(webhookData);
      expect(result).toBe(100);
    });

    it("deve extrair comissão do campo aninhado 'Commissions.my_commission'", () => {
      const webhookData = {
        Commissions: {
          my_commission: 250,
        },
      };
      const result = extractCommissionFromWebhook(webhookData);
      expect(result).toBe(250);
    });

    it("deve retornar 0 se comissão não for encontrada", () => {
      const webhookData = { orderId: "123", amount: 1000 };
      const result = extractCommissionFromWebhook(webhookData);
      expect(result).toBe(0);
    });

    it("deve retornar 0 se comissão for negativa", () => {
      const webhookData = { commission: -10 };
      const result = extractCommissionFromWebhook(webhookData);
      expect(result).toBe(0);
    });
  });

  describe("processSaleWithAccumulatedCommission", () => {
    const mockUserId = "test-user-id";
    const mockSaleData = {
      userId: mockUserId,
      orderId: "order-123",
      productName: "Produto Teste",
      amount: 100,
      currency: "BRL",
      status: "completed" as const,
      webhookData: { commission: 50 },
    };

    it("deve lançar erro se userId não fornecido", async () => {
      await expect(
        processSaleWithAccumulatedCommission("", mockSaleData, 50)
      ).rejects.toThrow(ValidationError);
    });

    it("deve lançar erro se comissão for negativa", async () => {
      await expect(
        processSaleWithAccumulatedCommission(mockUserId, mockSaleData, -10)
      ).rejects.toThrow(ValidationError);
    });

    it("deve processar venda com tipo 'sale' e não acumular", async () => {
      const mockUser = {
        uid: mockUserId,
        email: "test@example.com",
        displayName: "Test User",
        tiktok: {
          accessToken: "",
          webhookUrl: "",
          isValid: false,
        },
        telegram: {
          botToken: "",
          chatId: "",
          isConfigured: false,
        },
        notificationSettings: {
          type: "sale" as const,
        },
        accumulatedCommission: 0,
        createdAt: {},
        updatedAt: {},
      };

      const mockUserRef = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => mockUser,
        }),
        update: jest.fn(),
      };

      const mockSaleRef = {
        get: jest.fn().mockResolvedValue({
          data: () => ({
            id: "sale-id",
            ...mockSaleData,
            commission: 50,
            notificationSent: false,
            createdAt: {},
          }),
        }),
        set: jest.fn(),
      };

      const mockCollection = jest.fn((collectionName: string) => {
        if (collectionName === "usuarios") {
          return {
            doc: jest.fn().mockReturnValue(mockUserRef),
          };
        }
        if (collectionName === "vendas") {
          return {
            doc: jest.fn().mockReturnValue(mockSaleRef),
          };
        }
        return {
          doc: jest.fn().mockReturnValue({
            id: "sale-id",
          }),
        };
      });

      (db.collection as jest.Mock).mockImplementation(mockCollection);
      (db.runTransaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback({
          get: (ref: any) => ref.get(),
          update: (ref: any, data: any) => ref.update(data),
          set: (ref: any, data: any) => ref.set(data),
        });
      });

      const result = await processSaleWithAccumulatedCommission(
        mockUserId,
        mockSaleData,
        50
      );

      expect(result.shouldNotify).toBe(false);
      expect(result.newAccumulated).toBe(0);
      expect(result.notificationType).toBe("sale");
      expect(result.notificationData).toBeUndefined();
    });

    it("deve processar venda com tipo 'accumulated_commission' e acumular sem atingir threshold", async () => {
      const mockUser = {
        uid: mockUserId,
        email: "test@example.com",
        displayName: "Test User",
        tiktok: {
          accessToken: "",
          webhookUrl: "",
          isValid: false,
        },
        telegram: {
          botToken: "",
          chatId: "",
          isConfigured: false,
        },
        notificationSettings: {
          type: "accumulated_commission" as const,
          accumulatedCommissionThreshold: 100,
        },
        accumulatedCommission: 30,
        createdAt: {},
        updatedAt: {},
      };

      const mockUserRef = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => mockUser,
        }),
        update: jest.fn(),
      };

      const mockSaleRef = {
        get: jest.fn().mockResolvedValue({
          data: () => ({
            id: "sale-id",
            ...mockSaleData,
            commission: 50,
            notificationSent: false,
            createdAt: {},
          }),
        }),
        set: jest.fn(),
      };

      const mockCollection = jest.fn((collectionName: string) => {
        if (collectionName === "usuarios") {
          return {
            doc: jest.fn().mockReturnValue(mockUserRef),
          };
        }
        if (collectionName === "vendas") {
          return {
            doc: jest.fn().mockReturnValue(mockSaleRef),
          };
        }
        return {
          doc: jest.fn().mockReturnValue({
            id: "sale-id",
          }),
        };
      });

      (db.collection as jest.Mock).mockImplementation(mockCollection);
      (db.runTransaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback({
          get: (ref: any) => ref.get(),
          update: (ref: any, data: any) => ref.update(data),
          set: (ref: any, data: any) => ref.set(data),
        });
      });

      const result = await processSaleWithAccumulatedCommission(
        mockUserId,
        mockSaleData,
        50
      );

      expect(result.shouldNotify).toBe(false);
      expect(result.newAccumulated).toBe(80); // 30 + 50
      expect(result.notificationType).toBe("accumulated_commission");
      expect(result.notificationData).toBeUndefined();
    });

    it("deve processar venda com tipo 'accumulated_commission' e atingir threshold", async () => {
      const mockUser = {
        uid: mockUserId,
        email: "test@example.com",
        displayName: "Test User",
        tiktok: {
          accessToken: "",
          webhookUrl: "",
          isValid: false,
        },
        telegram: {
          botToken: "",
          chatId: "",
          isConfigured: false,
        },
        notificationSettings: {
          type: "accumulated_commission" as const,
          accumulatedCommissionThreshold: 100,
        },
        accumulatedCommission: 60,
        createdAt: {},
        updatedAt: {},
      };

      const mockUserRef = {
        get: jest.fn().mockResolvedValue({
          exists: true,
          data: () => mockUser,
        }),
        update: jest.fn(),
      };

      const mockSaleRef = {
        get: jest.fn().mockResolvedValue({
          data: () => ({
            id: "sale-id",
            ...mockSaleData,
            commission: 50,
            notificationSent: true,
            createdAt: {},
          }),
        }),
        set: jest.fn(),
      };

      const mockCollection = jest.fn((collectionName: string) => {
        if (collectionName === "usuarios") {
          return {
            doc: jest.fn().mockReturnValue(mockUserRef),
          };
        }
        if (collectionName === "vendas") {
          return {
            doc: jest.fn().mockReturnValue(mockSaleRef),
          };
        }
        return {
          doc: jest.fn().mockReturnValue({
            id: "sale-id",
          }),
        };
      });

      (db.collection as jest.Mock).mockImplementation(mockCollection);
      (db.runTransaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback({
          get: (ref: any) => ref.get(),
          update: (ref: any, data: any) => ref.update(data),
          set: (ref: any, data: any) => ref.set(data),
        });
      });

      const result = await processSaleWithAccumulatedCommission(
        mockUserId,
        mockSaleData,
        50
      );

      expect(result.shouldNotify).toBe(true);
      expect(result.newAccumulated).toBe(10); // (60 + 50) - 100
      expect(result.notificationType).toBe("accumulated_commission");
      expect(result.notificationData).toBeDefined();
      expect(result.notificationData?.accumulatedAmount).toBe(110);
      expect(result.notificationData?.threshold).toBe(100);
    });

    it("deve lançar erro se usuário não encontrado", async () => {
      const mockUserRef = {
        get: jest.fn().mockResolvedValue({
          exists: false,
        }),
      };

      const mockCollection = jest.fn(() => ({
        doc: jest.fn().mockReturnValue(mockUserRef),
      }));

      (db.collection as jest.Mock).mockImplementation(mockCollection);
      (db.runTransaction as jest.Mock).mockImplementation(async (callback) => {
        return await callback({
          get: (ref: any) => ref.get(),
          update: (ref: any, data: any) => ref.update(data),
          set: (ref: any, data: any) => ref.set(data),
        });
      });

      await expect(
        processSaleWithAccumulatedCommission(mockUserId, mockSaleData, 50)
      ).rejects.toThrow(NotFoundError);
    });
  });
});

