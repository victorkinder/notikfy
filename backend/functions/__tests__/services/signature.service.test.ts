import {
  generateAccessToken,
  createSignature,
  findSignatureByEmail,
  findSignatureByToken,
  updateSignatureStatus,
  findUserIdByAccessToken,
  linkAccessTokenToUserId,
} from "../../src/services/signature.service";
import { db } from "../../src/config/firebase.config";

jest.mock("../../src/config/firebase.config", () => ({
  db: {
    collection: jest.fn(),
  },
}));

describe("signature.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("generateAccessToken", () => {
    it("deve gerar um token de 10 caracteres", () => {
      const token = generateAccessToken();
      expect(token).toHaveLength(10);
      expect(token).toMatch(/^[A-Z0-9]+$/);
    });
  });

  describe("createSignature", () => {
    it("deve criar assinatura com dados válidos", async () => {
      const mockDoc = {
        set: jest.fn().mockResolvedValue(undefined),
      };
      const mockCollection = {
        doc: jest.fn().mockReturnValue(mockDoc),
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue({ empty: true }),
          }),
        }),
      };

      (db.collection as jest.Mock).mockReturnValue(mockCollection);

      const result = await createSignature({
        email: "test@example.com",
        planId: "STARTER",
        planName: "Iniciante",
      });

      expect(result.email).toBe("test@example.com");
      expect(result.plan.id).toBe("STARTER");
      expect(result.access_token).toHaveLength(10);
    });
  });

  describe("findUserIdByAccessToken", () => {
    it("deve retornar userId se encontrado", async () => {
      const mockSignature = {
        email: "test@example.com",
        access_token: "TEST123",
        userId: "user123",
      };

      const mockSnapshot = {
        empty: false,
        docs: [
          {
            data: () => mockSignature,
          },
        ],
      };

      const mockCollection = {
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue(mockSnapshot),
          }),
        }),
      };

      (db.collection as jest.Mock).mockReturnValue(mockCollection);

      const result = await findUserIdByAccessToken("TEST123");

      expect(result).toBe("user123");
    });

    it("deve retornar null se token não encontrado", async () => {
      const mockSnapshot = {
        empty: true,
        docs: [],
      };

      const mockCollection = {
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue(mockSnapshot),
          }),
        }),
      };

      (db.collection as jest.Mock).mockReturnValue(mockCollection);

      const result = await findUserIdByAccessToken("INVALID");

      expect(result).toBeNull();
    });

    it("deve retornar null se signature não tiver userId", async () => {
      const mockSignature = {
        email: "test@example.com",
        access_token: "TEST123",
        userId: undefined,
      };

      const mockSnapshot = {
        empty: false,
        docs: [
          {
            data: () => mockSignature,
          },
        ],
      };

      const mockCollection = {
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue(mockSnapshot),
          }),
        }),
      };

      (db.collection as jest.Mock).mockReturnValue(mockCollection);

      const result = await findUserIdByAccessToken("TEST123");

      expect(result).toBeNull();
    });
  });

  describe("linkAccessTokenToUserId", () => {
    it("deve vincular userId ao access_token", async () => {
      const mockSignature = {
        email: "test@example.com",
        access_token: "TEST123",
        userId: undefined,
      };

      const mockSnapshot = {
        empty: false,
        docs: [
          {
            data: () => mockSignature,
          },
        ],
      };

      const mockDoc = {
        update: jest.fn().mockResolvedValue(undefined),
      };

      const mockCollection = {
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue(mockSnapshot),
          }),
        }),
        doc: jest.fn().mockReturnValue(mockDoc),
      };

      (db.collection as jest.Mock).mockReturnValue(mockCollection);

      await linkAccessTokenToUserId("TEST123", "user123");

      expect(mockDoc.update).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user123",
        })
      );
    });

    it("deve lançar erro se tentar vincular a outro userId", async () => {
      const mockSignature = {
        email: "test@example.com",
        access_token: "TEST123",
        userId: "user456",
      };

      const mockSnapshot = {
        empty: false,
        docs: [
          {
            data: () => mockSignature,
          },
        ],
      };

      const mockCollection = {
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue(mockSnapshot),
          }),
        }),
      };

      (db.collection as jest.Mock).mockReturnValue(mockCollection);

      await expect(
        linkAccessTokenToUserId("TEST123", "user123")
      ).rejects.toThrow("já está vinculado a outro usuário");
    });

    it("deve lançar erro se access_token não encontrado", async () => {
      const mockSnapshot = {
        empty: true,
        docs: [],
      };

      const mockCollection = {
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            get: jest.fn().mockResolvedValue(mockSnapshot),
          }),
        }),
      };

      (db.collection as jest.Mock).mockReturnValue(mockCollection);

      await expect(
        linkAccessTokenToUserId("INVALID", "user123")
      ).rejects.toThrow("Assinatura não encontrada");
    });
  });
});

