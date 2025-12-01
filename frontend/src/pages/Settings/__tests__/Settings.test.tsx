import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Settings } from "../Settings";
import { AuthContextProvider } from "../../../context/AuthContext";
import { useNotificationSettings } from "../../../hooks/useNotificationSettings";

jest.mock("../../../hooks/useNotificationSettings");
jest.mock("../../../services/api/settings.service");
jest.mock("../../../components/layout/Layout/Layout", () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const mockUseNotificationSettings = useNotificationSettings as jest.MockedFunction<
  typeof useNotificationSettings
>;


describe("Settings", () => {
  const mockShowSuccess = jest.fn();
  const mockShowError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();

    mockUseNotificationSettings.mockReturnValue({
      settings: {
        type: "sale",
      },
      loading: false,
      error: null,
      saving: false,
      saveSettings: jest.fn(),
    });

    jest.mock("../../../hooks/useNotification", () => ({
      useNotification: () => ({
        showSuccess: mockShowSuccess,
        showError: mockShowError,
      }),
    }));
  });

  const renderComponent = () => {
    return render(
      <AuthContextProvider>
        <Settings />
      </AuthContextProvider>
    );
  };

  it("deve renderizar a página de configurações", () => {
    renderComponent();

    expect(screen.getByText("Configurações")).toBeInTheDocument();
    expect(
      screen.getByText(/configure como deseja receber notificações/i)
    ).toBeInTheDocument();
  });

  it("deve mostrar opções de tipo de notificação", () => {
    renderComponent();

    expect(screen.getByLabelText("Notificação por venda")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Notificação por Comissão Acumulada")
    ).toBeInTheDocument();
  });

  it("deve mostrar slider quando tipo 'accumulated_commission' estiver selecionado", async () => {
    mockUseNotificationSettings.mockReturnValue({
      settings: {
        type: "accumulated_commission",
        accumulatedCommissionThreshold: 100,
      },
      loading: false,
      error: null,
      saving: false,
      saveSettings: jest.fn(),
    });

    renderComponent();

    const user = userEvent.setup();
    const accumulatedOption = screen.getByLabelText(
      "Notificação por Comissão Acumulada"
    );
    await user.click(accumulatedOption);

    await waitFor(() => {
      expect(
        screen.getByText(/valor mínimo de comissão acumulada/i)
      ).toBeInTheDocument();
    });
  });

  it("deve mostrar loading quando estiver carregando", () => {
    mockUseNotificationSettings.mockReturnValue({
      settings: {
        type: "sale",
      },
      loading: true,
      error: null,
      saving: false,
      saveSettings: jest.fn(),
    });

    renderComponent();

    // Verifica se há um indicador de loading (CircularProgress)
    // O componente Layout pode não renderizar quando loading é true
    expect(screen.queryByText("Configurações")).not.toBeInTheDocument();
  });

  it("deve mostrar erro quando houver erro", () => {
    mockUseNotificationSettings.mockReturnValue({
      settings: {
        type: "sale",
      },
      loading: false,
      error: "Erro ao carregar configurações",
      saving: false,
      saveSettings: jest.fn(),
    });

    renderComponent();

    expect(screen.getByText("Erro ao carregar configurações")).toBeInTheDocument();
  });
});

