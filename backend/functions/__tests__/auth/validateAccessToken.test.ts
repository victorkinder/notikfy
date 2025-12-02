import { Request, Response } from "express";
import { validateAccessToken } from "../../src/auth/validateAccessToken";
import { findSignatureByToken, isSignatureValid, linkAccessTokenToUserId } from "../../src/services/signature.service";
import { auth } from "../../src/config/firebase.config";

jest.mock("../../src/services/signature.service");
jest.mock("../../src/config/firebase.config", () => ({
  auth: {
    verifyIdToken: jest.fn(),
  },
}));

describe("validateAccessToken", () => {
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
      body: {
        accessToken: "TEST123",
        idToken: "google-id-token",
      },
    };
  });

  it("deve validar access_token com sucesso e vincular userId se não existir", async () => {
    const mockUserId = "user123";
    const mockSignature = {
      email: "test@example.com",
      access_token: "TEST123",
      plan: { id: "STARTER", name: "Iniciante" },
      status: "active",
      userId: undefined,
    };
    const mockUpdatedSignature = {
      ...mockSignature,
      userId: mockUserId,
    };

    (auth.verifyIdToken as jest.Mock).mockResolvedValue({
      uid: mockUserId,
      email: "test@example.com",
    });
    (findSignatureByToken as jest.Mock)
      .mockResolvedValueOnce(mockSignature)
      .mockResolvedValueOnce(mockUpdatedSignature);
    (isSignatureValid as jest.Mock).mockResolvedValue(true);
    (linkAccessTokenToUserId as jest.Mock).mockResolvedValue(undefined);

    await validateAccessToken(
      mockRequest as Request,
      mockResponse as Response
    );

    expect(findSignatureByToken).toHaveBeenCalledWith("TEST123");
    expect(linkAccessTokenToUserId).toHaveBeenCalledWith("TEST123", mockUserId);
    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          valid: true,
        }),
      })
    );
  });

  it("deve rejeitar access_token se pertencer a outro usuário", async () => {
    const mockUserId = "user123";
    const mockOtherUserId = "user456";
    const mockSignature = {
      email: "test@example.com",
      access_token: "TEST123",
      plan: { id: "STARTER", name: "Iniciante" },
      status: "active",
      userId: mockOtherUserId,
    };

    (auth.verifyIdToken as jest.Mock).mockResolvedValue({
      uid: mockUserId,
      email: "test@example.com",
    });
    (findSignatureByToken as jest.Mock).mockResolvedValue(mockSignature);
    (isSignatureValid as jest.Mock).mockResolvedValue(true);

    await validateAccessToken(
      mockRequest as Request,
      mockResponse as Response
    );

    expect(findSignatureByToken).toHaveBeenCalledWith("TEST123");
    expect(linkAccessTokenToUserId).not.toHaveBeenCalled();
    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          valid: false,
          message: "Este access token pertence a outro usuário",
        }),
      })
    );
  });

  it("deve retornar inválido se token não encontrado", async () => {
    (auth.verifyIdToken as jest.Mock).mockResolvedValue({
      uid: "user123",
      email: "test@example.com",
    });
    (findSignatureByToken as jest.Mock).mockResolvedValue(null);

    await validateAccessToken(
      mockRequest as Request,
      mockResponse as Response
    );

    expect(mockStatus).toHaveBeenCalledWith(200);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          valid: false,
        }),
      })
    );
  });
});

