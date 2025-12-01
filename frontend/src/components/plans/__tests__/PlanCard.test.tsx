import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlanCard } from "../PlanCard";
import { PLANS } from "../../../types/activation.types";

// Mock do window.open
const mockOpen = jest.fn();
window.open = mockOpen;

describe("PlanCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockOpen.mockClear();
  });

  const renderComponent = (kiwifyUrl?: string) => {
    return render(<PlanCard plan={PLANS.STARTER} kiwifyUrl={kiwifyUrl} />);
  };

  it("deve renderizar o card do plano corretamente", () => {
    renderComponent();

    expect(screen.getByText("Iniciante")).toBeInTheDocument();
    expect(
      screen.getByText("Conecte até 5 contas do TikTok ao mesmo tempo")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Obter Código/i })
    ).toBeInTheDocument();
  });

  it("deve abrir URL da Kiwify quando botão for clicado", async () => {
    const kiwifyUrl = "https://kiwify.com.br/produto/starter";
    const user = userEvent.setup();
    renderComponent(kiwifyUrl);

    const button = screen.getByRole("button", { name: /Obter Código/i });
    await user.click(button);

    expect(mockOpen).toHaveBeenCalledWith(kiwifyUrl, "_blank");
  });

  it("deve mostrar alerta quando URL não estiver configurada", async () => {
    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
    const user = userEvent.setup();
    // Cria um plano sem kiwifyUrl para testar o caso sem URL
    const planWithoutUrl = { ...PLANS.STARTER, kiwifyUrl: undefined };
    render(<PlanCard plan={planWithoutUrl} />);

    const button = screen.getByRole("button", { name: /Obter Código/i });
    await user.click(button);

    expect(alertSpy).toHaveBeenCalledWith(
      "Link de compra não configurado. Entre em contato com o suporte."
    );

    alertSpy.mockRestore();
  });
});
