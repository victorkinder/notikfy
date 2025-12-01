import { Request, Response } from "express";
import { validateAccessToken } from "../../src/auth/validateAccessToken";
import { findSignatureByToken, isSignatureValid } from "../../src/services/signature.service";
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

  it("deve validar access_token com sucesso", async () => {
    const mockSignature = {
      email: "test@example.com",
      access_token: "TEST123",
      plan: { id: "STARTER", name: "Iniciante" },
      status: "active",
    };

    (auth.verifyIdToken as jest.Mock).mockResolvedValue({
      uid: "user123",
      email: "test@example.com",
    });
    (findSignatureByToken as jest.Mock).mockResolvedValue(mockSignature);
    (isSignatureValid as jest.Mock).mockResolvedValue(true);

    await validateAccessToken(
      mockRequest as Request,
      mockResponse as Response
    );

    expect(findSignatureByToken).toHaveBeenCalledWith("TEST123");
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

