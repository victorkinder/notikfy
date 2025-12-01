import {
  createDefaultNotificationSettings,
  findUserByUid,
  createUser,
  getOrCreateUser,
  updateNotificationSettings,
} from "../../src/services/user.service";
import { db } from "../../src/config/firebase.config";
import { ValidationError, NotFoundError } from "../../src/utils/errors";

jest.mock("../../src/config/firebase.config", () => ({
  db: {
    collection: jest.fn(),
  },
}));

describe("user.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("createDefaultNotificationSettings", () => {
    it("deve criar configurações padrão com tipo 'sale'", () => {
      const settings = createDefaultNotificationSettings();
      expect(settings.type).toBe("sale");
      expect(settings.accumulatedCommissionThreshold).toBeUndefined();
    });
  });

  describe("findUserByUid", () => {
    it("deve retornar usuário quando encontrado", async () => {
      const mockUser = {
        uid: "test-uid",
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
        createdAt: {},
        updatedAt: {},
      };

      const mockDoc = {
        exists: true,
        data: () => mockUser,
      };

      const mockCollection = {
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockDoc),
        }),
      };

      (db.collection as jest.Mock).mockReturnValue(mockCollection);

      const result = await findUserByUid("test-uid");

      expect(result).toEqual(mockUser);
      expect(db.collection).toHaveBeenCalledWith("usuarios");
    });

    it("deve retornar null quando usuário não encontrado", async () => {
      const mockDoc = {
        exists: false,
      };

      const mockCollection = {
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockDoc),
        }),
      };

      (db.collection as jest.Mock).mockReturnValue(mockCollection);

      const result = await findUserByUid("non-existent-uid");

      expect(result).toBeNull();
    });
  });

  describe("createUser", () => {
    it("deve criar usuário com configurações padrão de notificação", async () => {
      const mockDoc = {
        set: jest.fn().mockResolvedValue(undefined),
      };

      const mockCollection = {
        doc: jest.fn().mockReturnValue(mockDoc),
      };

      (db.collection as jest.Mock).mockReturnValue(mockCollection);

      const userData = {
        uid: "test-uid",
        email: "test@example.com",
        displayName: "Test User",
      };

      const result = await createUser(userData);

      expect(result.uid).toBe(userData.uid);
      expect(result.email).toBe(userData.email);
      expect(result.notificationSettings).toEqual({
        type: "sale",
      });
      expect(mockDoc.set).toHaveBeenCalled();
    });
  });

  describe("getOrCreateUser", () => {
    it("deve retornar usuário existente", async () => {
      const mockUser = {
        uid: "test-uid",
        email: "test@example.com",
        displayName: "Test User",
        notificationSettings: {
          type: "sale",
        },
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
        createdAt: {},
        updatedAt: {},
      };

      const mockDoc = {
        exists: true,
        data: () => mockUser,
      };

      const mockCollection = {
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockDoc),
        }),
      };

      (db.collection as jest.Mock).mockReturnValue(mockCollection);

      const result = await getOrCreateUser(
        "test-uid",
        "test@example.com",
        "Test User"
      );

      expect(result).toEqual(mockUser);
    });

    it("deve criar usuário quando não existe", async () => {
      const mockDocGet = {
        exists: false,
      };

      const mockDocSet = {
        set: jest.fn().mockResolvedValue(undefined),
      };

      const mockCollection = {
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockDocGet),
          set: mockDocSet.set,
        }),
      };

      (db.collection as jest.Mock).mockReturnValue(mockCollection);

      const result = await getOrCreateUser(
        "new-uid",
        "new@example.com",
        "New User"
      );

      expect(result.uid).toBe("new-uid");
      expect(result.notificationSettings).toEqual({
        type: "sale",
      });
    });
  });

  describe("updateNotificationSettings", () => {
    it("deve atualizar configurações de notificação com sucesso", async () => {
      const mockUser = {
        uid: "test-uid",
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
        createdAt: {},
        updatedAt: {},
      };

      const mockDocGet = {
        exists: true,
        data: () => mockUser,
      };

      const mockDocUpdate = {
        update: jest.fn().mockResolvedValue(undefined),
      };

      const mockCollection = {
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockDocGet),
          update: mockDocUpdate.update,
        }),
      };

      (db.collection as jest.Mock).mockReturnValue(mockCollection);

      const settings = {
        type: "accumulated_commission" as const,
        accumulatedCommissionThreshold: 250,
      };

      const result = await updateNotificationSettings("test-uid", settings);

      expect(result.type).toBe("accumulated_commission");
      expect(result.accumulatedCommissionThreshold).toBe(250);
      expect(mockDocUpdate.update).toHaveBeenCalled();
    });

    it("deve lançar erro quando usuário não encontrado", async () => {
      const mockDocGet = {
        exists: false,
      };

      const mockCollection = {
        doc: jest.fn().mockReturnValue({
          get: jest.fn().mockResolvedValue(mockDocGet),
        }),
      };

      (db.collection as jest.Mock).mockReturnValue(mockCollection);

      await expect(
        updateNotificationSettings("non-existent-uid", {
          type: "sale",
        })
      ).rejects.toThrow(NotFoundError);
    });

    it("deve lançar erro quando tipo é inválido", async () => {
      await expect(
        updateNotificationSettings("test-uid", {
          type: "invalid" as any,
        })
      ).rejects.toThrow(ValidationError);
    });

    it("deve lançar erro quando threshold é inválido para tipo accumulated_commission", async () => {
      await expect(
        updateNotificationSettings("test-uid", {
          type: "accumulated_commission",
          accumulatedCommissionThreshold: 999,
        })
      ).rejects.toThrow(ValidationError);
    });
  });
});

