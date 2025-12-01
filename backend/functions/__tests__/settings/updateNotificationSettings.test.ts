import { Request, Response } from "express";
import { updateNotificationSettingsFunction } from "../../src/settings/updateNotificationSettings";
import { updateNotificationSettings } from "../../src/services/user.service";
import { auth } from "../../src/config/firebase.config";
import { UnauthorizedError, ValidationError } from "../../src/utils/errors";

jest.mock("../../src/services/user.service");
jest.mock("../../src/config/firebase.config", () => ({
  auth: {
    verifyIdToken: jest.fn(),
  },
}));

const mockUpdateNotificationSettings = updateNotificationSettings as jest.MockedFunction<
  typeof updateNotificationSettings
>;
const mockVerifyIdToken = auth.verifyIdToken as jest.MockedFunction<
  typeof auth.verifyIdToken
>;

describe("updateNotificationSettings Cloud Function", () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRequest = {
      method: "POST",
      headers: {
        authorization: "Bearer mock-token",
      },
      body: {
        type: "sale",
      },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockVerifyIdToken.mockResolvedValue({
      uid: "test-uid",
      email: "test@example.com",
    } as any);
  });

  it("deve atualizar configurações com sucesso", async () => {
    const mockSettings = {
      type: "sale" as const,
    };

    mockUpdateNotificationSettings.mockResolvedValue(mockSettings);

    await updateNotificationSettingsFunction(
      mockRequest as Request,
      mockResponse as Response
    );

    expect(mockVerifyIdToken).toHaveBeenCalledWith("mock-token");
    expect(mockUpdateNotificationSettings).toHaveBeenCalledWith(
      "test-uid",
      mockRequest.body
    );
    expect(mockResponse.status).toHaveBeenCalledWith(200);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: true,
      message: "Configurações de notificação atualizadas com sucesso",
      data: mockSettings,
    });
  });

  it("deve retornar erro 405 para método não permitido", async () => {
    mockRequest.method = "GET";

    await updateNotificationSettingsFunction(
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

  it("deve retornar erro 401 quando token não fornecido", async () => {
    mockRequest.headers = {};

    await updateNotificationSettingsFunction(
      mockRequest as Request,
      mockResponse as Response
    );

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: "UnauthorizedError",
      })
    );
  });

  it("deve retornar erro 400 quando tipo não fornecido", async () => {
    mockRequest.body = {};

    await updateNotificationSettingsFunction(
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

  it("deve atualizar configurações com comissão acumulada", async () => {
    const mockSettings = {
      type: "accumulated_commission" as const,
      accumulatedCommissionThreshold: 250,
    };

    mockRequest.body = mockSettings;
    mockUpdateNotificationSettings.mockResolvedValue(mockSettings);

    await updateNotificationSettingsFunction(
      mockRequest as Request,
      mockResponse as Response
    );

    expect(mockUpdateNotificationSettings).toHaveBeenCalledWith(
      "test-uid",
      mockSettings
    );
    expect(mockResponse.status).toHaveBeenCalledWith(200);
  });

  it("deve retornar erro 500 quando ocorre erro interno", async () => {
    mockUpdateNotificationSettings.mockRejectedValue(
      new Error("Erro interno")
    );

    await updateNotificationSettingsFunction(
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
});

