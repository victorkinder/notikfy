import { Request, Response } from "express";
import { purchasePlan } from "../../src/activation/purchasePlan";
import { createActivationKeyForPlan } from "../../src/services/activation.service";
import { auth } from "../../src/config/firebase.config";

jest.mock("../../src/services/activation.service");
jest.mock("../../src/config/firebase.config", () => ({
  auth: {
    verifyIdToken: jest.fn(),
  },
}));

describe("purchasePlan", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

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
      body: {
        planId: "STARTER",
      },
    };
  });

  it("deve comprar plano com sucesso", async () => {
    const mockUserId = "user123";
    const mockPurchaseData = {
      key: "TEST123",
      planId: "STARTER" as const,
      planName: "Iniciante",
      maxAccounts: 5,
    };

    (auth.verifyIdToken as jest.Mock).mockResolvedValue({
      uid: mockUserId,
    });
    (createActivationKeyForPlan as jest.Mock).mockResolvedValue(
      mockPurchaseData
    );

    await purchasePlan(
      mockRequest as Request,
      mockResponse as Response
    );

    expect(auth.verifyIdToken).toHaveBeenCalledWith("test-token");
    expect(createActivationKeyForPlan).toHaveBeenCalledWith("STARTER");
    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      success: true,
      message: "Plano comprado com sucesso. Chave de ativação gerada.",
      data: mockPurchaseData,
    });
  });

  it("deve retornar erro 405 para método não permitido", async () => {
    mockRequest.method = "GET";

    await purchasePlan(
      mockRequest as Request,
      mockResponse as Response
    );

    expect(mockStatus).toHaveBeenCalledWith(405);
    expect(mockJson).toHaveBeenCalledWith({
      success: false,
      error: "MethodNotAllowed",
      message: "Método não permitido. Use POST.",
    });
  });

  it("deve retornar erro 401 para token inválido", async () => {
    (auth.verifyIdToken as jest.Mock).mockRejectedValue(
      new Error("Token inválido")
    );

    await purchasePlan(
      mockRequest as Request,
      mockResponse as Response
    );

    expect(mockStatus).toHaveBeenCalledWith(401);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: "UnauthorizedError",
      })
    );
  });

  it("deve retornar erro 400 para plano inválido", async () => {
    const mockUserId = "user123";

    (auth.verifyIdToken as jest.Mock).mockResolvedValue({
      uid: mockUserId,
    });
    mockRequest.body = {
      planId: "INVALID",
    };

    await purchasePlan(
      mockRequest as Request,
      mockResponse as Response
    );

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: "ValidationError",
      })
    );
  });
});

