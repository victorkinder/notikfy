import { renderHook } from "@testing-library/react";
import { useSignatureStatus } from "../useSignatureStatus";
import { useAuth } from "../../context/AuthContext";
import { useActivation } from "../../context/ActivationContext";
import { validateAccessToken } from "../../services/api/activation.service";

jest.mock("../../context/AuthContext");
jest.mock("../../context/ActivationContext");
jest.mock("../../services/api/activation.service");
jest.mock("../../services/firebase/auth.service");

describe("useSignatureStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("não deve fazer nada se usuário não estiver logado", () => {
    (useAuth as jest.Mock).mockReturnValue({ user: null });
    (useActivation as jest.Mock).mockReturnValue({
      activationStatus: { isActivated: false },
    });

    renderHook(() => useSignatureStatus());

    expect(validateAccessToken).not.toHaveBeenCalled();
  });

  it("deve verificar status quando usuário está ativado", async () => {
    const mockUser = { uid: "user123", email: "test@example.com" };
    const mockActivationData = {
      accessToken: "TEST123",
      planId: "STARTER",
    };

    (useAuth as jest.Mock).mockReturnValue({ user: mockUser });
    (useActivation as jest.Mock).mockReturnValue({
      activationStatus: {
        isActivated: true,
        activationData: mockActivationData,
      },
      clearActivation: jest.fn(),
    });

    (validateAccessToken as jest.Mock).mockResolvedValue({
      valid: true,
      signature: { status: "active" },
    });

    renderHook(() => useSignatureStatus(1000));

    // Avança o timer para disparar a verificação
    jest.advanceTimersByTime(1000);

    await Promise.resolve();

    expect(validateAccessToken).toHaveBeenCalledWith("TEST123");
  });
});
