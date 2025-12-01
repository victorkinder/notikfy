import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { Activation } from "../Activation";
import { ActivationContextProvider } from "../../../context/ActivationContext";
import { PLANS } from "../../../types/activation.types";

// Mock do useNavigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

describe("Activation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <ActivationContextProvider>
          <Activation />
        </ActivationContextProvider>
      </BrowserRouter>
    );
  };

  it("deve renderizar a página de ativação corretamente", () => {
    renderComponent();

    expect(screen.getByText("Ative sua conta")).toBeInTheDocument();
    expect(
      screen.getByText(/digite sua chave de ativação ou escolha/i)
    ).toBeInTheDocument();
    expect(screen.getByText("Já possui uma chave?")).toBeInTheDocument();
    expect(screen.getByText("Escolha seu plano")).toBeInTheDocument();
  });

  it("deve renderizar os três planos", () => {
    renderComponent();

    expect(screen.getByText(PLANS.STARTER.name)).toBeInTheDocument();
    expect(screen.getByText(PLANS.SCALING.name)).toBeInTheDocument();
    expect(screen.getByText(PLANS.SCALED.name)).toBeInTheDocument();
  });

  it("deve redirecionar se já estiver ativado", () => {
    const activationData = {
      key: "TEST123",
      planId: "STARTER" as const,
      planName: "Iniciante",
      maxAccounts: 5,
      activatedAt: new Date().toISOString(),
    };

    localStorage.setItem("notikfy_activation", JSON.stringify(activationData));

    renderComponent();

    expect(mockNavigate).toHaveBeenCalledWith("/");
  });
});
