import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ActivationKeyForm } from "../ActivationKeyForm";
import { ActivationContextProvider } from "../../../context/ActivationContext";
import { activateKey as activateKeyService } from "../../../services/api/activation.service";

jest.mock("../../../services/api/activation.service", () => ({
  activateKey: jest.fn(),
}));

describe("ActivationKeyForm", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderComponent = (onSuccess?: () => void) => {
    return render(
      <ActivationContextProvider>
        <ActivationKeyForm onSuccess={onSuccess} />
      </ActivationContextProvider>
    );
  };

  it("deve renderizar o formulário corretamente", () => {
    renderComponent();

    expect(screen.getByText("Já possui uma chave?")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Digite sua chave de ativação")
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ativar/i })).toBeInTheDocument();
  });

  it("deve mostrar erro quando tentar ativar sem chave", async () => {
    const user = userEvent.setup();
    renderComponent();

    const button = screen.getByRole("button", { name: /ativar/i });
    await user.click(button);

    await waitFor(() => {
      expect(
        screen.getByText(/por favor, informe a chave/i)
      ).toBeInTheDocument();
    });
  });

  it("deve ativar chave com sucesso", async () => {
    const mockResponse = {
      planId: "STARTER" as const,
      planName: "Iniciante",
      maxAccounts: 5,
    };

    (activateKeyService as jest.Mock).mockResolvedValue(mockResponse);

    const onSuccess = jest.fn();
    const user = userEvent.setup();
    renderComponent(onSuccess);

    const input = screen.getByPlaceholderText("Digite sua chave de ativação");
    const button = screen.getByRole("button", { name: /ativar/i });

    await user.type(input, "TEST123");
    await user.click(button);

    await waitFor(() => {
      expect(activateKeyService).toHaveBeenCalledWith("TEST123");
      expect(
        screen.getByText(/chave ativada com sucesso/i)
      ).toBeInTheDocument();
    });

    await waitFor(
      () => {
        expect(onSuccess).toHaveBeenCalled();
      },
      { timeout: 2000 }
    );
  });

  it("deve mostrar erro quando ativação falhar", async () => {
    const errorMessage = "Chave inválida";
    (activateKeyService as jest.Mock).mockRejectedValue(
      new Error(errorMessage)
    );

    const user = userEvent.setup();
    renderComponent();

    const input = screen.getByPlaceholderText("Digite sua chave de ativação");
    const button = screen.getByRole("button", { name: /ativar/i });

    await user.type(input, "INVALID");
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });
});
