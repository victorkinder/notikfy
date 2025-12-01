import {
  generateAccessToken,
  createSignature,
  findSignatureByEmail,
  findSignatureByToken,
  updateSignatureStatus,
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
});

