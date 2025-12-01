import { updateNotificationSettings } from "../settings.service";
import { auth } from "../../firebase/config";

jest.mock("../../firebase/config", () => ({
  auth: {
    currentUser: {
      getIdToken: jest.fn(),
    },
  },
}));

global.fetch = jest.fn();

describe("settings.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  describe("updateNotificationSettings", () => {
    it("deve atualizar configurações com sucesso", async () => {
      const mockToken = "mock-token";
      const mockSettings = {
        type: "sale" as const,
      };
      const mockResponse = {
        success: true,
        data: mockSettings,
      };

      (auth.currentUser?.getIdToken as jest.Mock).mockResolvedValue(
        mockToken
      );
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await updateNotificationSettings(mockSettings);

      expect(result).toEqual(mockSettings);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/updateNotificationSettings"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: `Bearer ${mockToken}`,
          }),
          body: JSON.stringify(mockSettings),
        })
      );
    });

    it("deve lançar erro quando usuário não está autenticado", async () => {
      (auth.currentUser as any) = null;

      await expect(
        updateNotificationSettings({ type: "sale" })
      ).rejects.toThrow("Usuário não autenticado");
    });

    it("deve lançar erro quando a resposta não é bem-sucedida", async () => {
      const mockToken = "mock-token";
      const mockErrorResponse = {
        success: false,
        message: "Erro ao atualizar",
      };

      (auth.currentUser?.getIdToken as jest.Mock).mockResolvedValue(
        mockToken
      );
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        json: async () => mockErrorResponse,
      });

      await expect(
        updateNotificationSettings({ type: "sale" })
      ).rejects.toThrow("Erro ao atualizar");
    });

    it("deve atualizar configurações com comissão acumulada", async () => {
      const mockToken = "mock-token";
      const mockSettings = {
        type: "accumulated_commission" as const,
        accumulatedCommissionThreshold: 250,
      };
      const mockResponse = {
        success: true,
        data: mockSettings,
      };

      (auth.currentUser?.getIdToken as jest.Mock).mockResolvedValue(
        mockToken
      );
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await updateNotificationSettings(mockSettings);

      expect(result).toEqual(mockSettings);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("/updateNotificationSettings"),
        expect.objectContaining({
          body: JSON.stringify(mockSettings),
        })
      );
    });
  });
});

