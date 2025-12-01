import { renderHook, act } from "@testing-library/react";
import { ActivationContextProvider, useActivation } from "../ActivationContext";
import {
  validateAccessToken as validateAccessTokenService,
} from "../../services/api/activation.service";
import { ReactNode } from "react";

// Mock do serviço de ativação
jest.mock("../../services/api/activation.service", () => ({
  validateAccessToken: jest.fn(),
}));

// Mock do localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, "localStorage", {
  value: localStorageMock,
});

describe("ActivationContext", () => {
  beforeEach(() => {
    localStorageMock.clear();
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <ActivationContextProvider>{children}</ActivationContextProvider>
  );

  it("deve inicializar sem ativação", () => {
    const { result } = renderHook(() => useActivation(), { wrapper });

    expect(result.current.activationStatus.isActivated).toBe(false);
    expect(result.current.activationStatus.activationData).toBeNull();
  });

  it("deve carregar ativação do localStorage", () => {
    const activationData = {
      accessToken: "TEST123",
      planId: "STARTER" as const,
      planName: "Iniciante",
      maxAccounts: 3,
      activatedAt: new Date().toISOString(),
    };

    localStorageMock.setItem(
      "notikfy_activation",
      JSON.stringify(activationData)
    );

    const { result } = renderHook(() => useActivation(), { wrapper });

    expect(result.current.activationStatus.isActivated).toBe(true);
    expect(result.current.activationStatus.activationData).toEqual(
      activationData
    );
  });

  it("deve ativar um access token com sucesso", async () => {
    const mockValidationResponse = {
      valid: true,
      signature: {
        email: "test@example.com",
        initial_date: new Date().toISOString(),
        final_date: new Date().toISOString(),
        update_date: new Date().toISOString(),
        status: "active" as const,
        plan: {
          id: "STARTER" as const,
          name: "Iniciante",
        },
        access_token: "TEST123",
      },
    };

    (validateAccessTokenService as jest.Mock).mockResolvedValue(
      mockValidationResponse
    );

    const { result } = renderHook(() => useActivation(), { wrapper });

    await act(async () => {
      await result.current.activate("TEST123");
    });

    expect(result.current.activationStatus.isActivated).toBe(true);
    expect(
      result.current.activationStatus.activationData?.accessToken
    ).toBe("TEST123");
    expect(result.current.activationStatus.activationData?.planId).toBe(
      "STARTER"
    );
  });

  it("deve limpar ativação", () => {
    const activationData = {
      accessToken: "TEST123",
      planId: "STARTER" as const,
      planName: "Iniciante",
      maxAccounts: 3,
      activatedAt: new Date().toISOString(),
    };

    localStorageMock.setItem(
      "notikfy_activation",
      JSON.stringify(activationData)
    );

    const { result } = renderHook(() => useActivation(), { wrapper });

    act(() => {
      result.current.clearActivation();
    });

    expect(result.current.activationStatus.isActivated).toBe(false);
    expect(result.current.activationStatus.activationData).toBeNull();
    expect(localStorageMock.getItem("notikfy_activation")).toBeNull();
  });
});
