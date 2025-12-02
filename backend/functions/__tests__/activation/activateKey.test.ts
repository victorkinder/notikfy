import { Request, Response } from "express";
import { activateKey } from "../../src/activation/activateKey";
import { validateAndActivateKey } from "../../src/services/activation.service";
import { findSignatureByEmail, linkAccessTokenToUserId } from "../../src/services/signature.service";
import { getOrCreateUser } from "../../src/services/user.service";
import { auth } from "../../src/config/firebase.config";

jest.mock("../../src/services/activation.service");
jest.mock("../../src/services/signature.service");
jest.mock("../../src/services/user.service");
jest.mock("../../src/config/firebase.config", () => ({
  auth: {
    verifyIdToken: jest.fn(),
  },
}));

describe("activateKey", () => {
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
        key: "TEST123",
      },
    };
  });

  it("deve ativar chave com sucesso", async () => {
    const mockUserId = "user123";
    const mockEmail = "test@example.com";
    const mockActivationData = {
      planId: "STARTER" as const,
      planName: "Iniciante",
      maxAccounts: 5,
    };
    const mockSignature = {
      email: mockEmail,
      access_token: "ACCESS123",
      userId: undefined,
    };

    (auth.verifyIdToken as jest.Mock).mockResolvedValue({
      uid: mockUserId,
      email: mockEmail,
      name: "Test User",
    });
    (validateAndActivateKey as jest.Mock).mockResolvedValue(mockActivationData);
    (getOrCreateUser as jest.Mock).mockResolvedValue({});
    (findSignatureByEmail as jest.Mock).mockResolvedValue(mockSignature);
    (linkAccessTokenToUserId as jest.Mock).mockResolvedValue(undefined);

    await activateKey(
      mockRequest as Request,
      mockResponse as Response
    );

    expect(auth.verifyIdToken).toHaveBeenCalledWith("test-token");
    expect(validateAndActivateKey).toHaveBeenCalledWith("TEST123", mockUserId);
    expect(findSignatureByEmail).toHaveBeenCalledWith(mockEmail);
    expect(linkAccessTokenToUserId).toHaveBeenCalledWith("ACCESS123", mockUserId);
    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith({
      success: true,
      message: "Chave ativada com sucesso",
      data: mockActivationData,
    });
  });

  it("deve retornar erro 405 para método não permitido", async () => {
    mockRequest.method = "GET";

    await activateKey(
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

    await activateKey(
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

  it("deve retornar erro 400 para chave inválida", async () => {
    const mockUserId = "user123";

    (auth.verifyIdToken as jest.Mock).mockResolvedValue({
      uid: mockUserId,
    });
    (validateAndActivateKey as jest.Mock).mockRejectedValue(
      new Error("Chave de ativação inválida")
    );

    await activateKey(
      mockRequest as Request,
      mockResponse as Response
    );

    expect(mockStatus).toHaveBeenCalledWith(400);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
      })
    );
  });
});

