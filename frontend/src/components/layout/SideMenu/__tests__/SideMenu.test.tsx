import { render, screen, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { SideMenu } from "../SideMenu";
import { AuthContext } from "../../../../context/AuthContext";
import { User } from "firebase/auth";

// Mock do Firebase
jest.mock("../../../../services/firebase/auth.service", () => ({
  onAuthChange: jest.fn(() => jest.fn()),
}));

const mockUser: User = {
  uid: "123",
  email: "test@example.com",
  displayName: "Test User",
  photoURL: null,
} as User;

const mockAuthContextValue = {
  user: mockUser,
  loading: false,
};

const renderWithProviders = (
  component: React.ReactElement,
  authValue = mockAuthContextValue
) => {
  return render(
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>{component}</AuthContext.Provider>
    </BrowserRouter>
  );
};

const mockOnMobileClose = jest.fn();

describe("SideMenu", () => {
  it("deve renderizar o menu lateral", () => {
    renderWithProviders(<SideMenu />);
    expect(screen.getByLabelText("toggle menu")).toBeInTheDocument();
  });

  it("deve exibir os itens do menu quando expandido", () => {
    renderWithProviders(<SideMenu />);
    const toggleButton = screen.getByLabelText("toggle menu");
    fireEvent.click(toggleButton);
    expect(screen.getByText("Vendas")).toBeInTheDocument();
    expect(screen.getByText("Configurações")).toBeInTheDocument();
  });

  it("deve exibir o nome do usuário quando expandido", () => {
    renderWithProviders(<SideMenu />);
    const toggleButton = screen.getByLabelText("toggle menu");
    fireEvent.click(toggleButton);
    expect(screen.getByText("Test User")).toBeInTheDocument();
  });

  it("deve exibir o email do usuário quando expandido", () => {
    renderWithProviders(<SideMenu />);
    const toggleButton = screen.getByLabelText("toggle menu");
    fireEvent.click(toggleButton);
    expect(screen.getByText("test@example.com")).toBeInTheDocument();
  });

  it("deve usar o email como nome quando displayName não estiver disponível", () => {
    const userWithoutDisplayName = {
      ...mockUser,
      displayName: null,
    } as User;

    renderWithProviders(<SideMenu />, {
      user: userWithoutDisplayName,
      loading: false,
    });

    const toggleButton = screen.getByLabelText("toggle menu");
    fireEvent.click(toggleButton);
    expect(screen.getByText("test")).toBeInTheDocument();
  });

  it("deve exibir avatar do usuário", () => {
    renderWithProviders(<SideMenu />);
    const avatar = screen.getByText("T");
    expect(avatar).toBeInTheDocument();
  });

  it("deve recolher o menu ao clicar no botão de toggle", () => {
    renderWithProviders(<SideMenu />);
    const toggleButton = screen.getByLabelText("toggle menu");

    // Primeiro expande o menu
    fireEvent.click(toggleButton);
    expect(screen.getByText("Vendas")).toBeInTheDocument();

    // Depois recolhe
    fireEvent.click(toggleButton);

    const vendasText = screen.queryByText("Vendas");
    expect(vendasText).not.toBeVisible();
  });

  it("deve expandir o menu ao clicar novamente no botão de toggle", () => {
    renderWithProviders(<SideMenu />);
    const toggleButton = screen.getByLabelText("toggle menu");

    fireEvent.click(toggleButton);
    fireEvent.click(toggleButton);

    expect(screen.getByText("Vendas")).toBeInTheDocument();
  });

  it("deve destacar o item do menu ativo", () => {
    window.history.pushState({}, "Vendas", "/sales");
    renderWithProviders(<SideMenu />);
    const toggleButton = screen.getByLabelText("toggle menu");
    fireEvent.click(toggleButton);

    const vendasButton = screen
      .getByText("Vendas")
      .closest('[role="button"]');
    expect(vendasButton).toHaveClass("Mui-selected");
  });

  it("deve navegar para a rota ao clicar em um item do menu", () => {
    renderWithProviders(<SideMenu />);
    const toggleButton = screen.getByLabelText("toggle menu");
    fireEvent.click(toggleButton);
    const salesButton = screen.getByText("Vendas");

    fireEvent.click(salesButton);

    expect(window.location.pathname).toBe("/sales");
  });

  it("deve exibir avatar com inicial quando photoURL não estiver disponível", () => {
    const userWithoutPhoto = {
      ...mockUser,
      photoURL: null,
    } as User;

    renderWithProviders(<SideMenu />, {
      user: userWithoutPhoto,
      loading: false,
    });

    const avatar = screen.getByText("T");
    expect(avatar).toBeInTheDocument();
  });

  it("deve exibir 'Usuário' quando não houver email nem displayName", () => {
    const userMinimal = {
      uid: "123",
      email: null,
      displayName: null,
      photoURL: null,
    } as unknown as User;

    renderWithProviders(<SideMenu />, {
      user: userMinimal,
      loading: false,
    });

    const toggleButton = screen.getByLabelText("toggle menu");
    fireEvent.click(toggleButton);
    expect(screen.getByText("Usuário")).toBeInTheDocument();
  });

  describe("Comportamento Mobile", () => {
    beforeEach(() => {
      mockOnMobileClose.mockClear();
    });

    it("deve renderizar menu mobile fechado por padrão", () => {
      renderWithProviders(
        <SideMenu isMobile={true} mobileOpen={false} onMobileClose={mockOnMobileClose} />
      );
      const drawer = screen.queryByRole("presentation");
      expect(drawer).not.toBeInTheDocument();
    });

    it("deve renderizar menu mobile quando mobileOpen é true", () => {
      renderWithProviders(
        <SideMenu isMobile={true} mobileOpen={true} onMobileClose={mockOnMobileClose} />
      );
      expect(screen.getByText("Vendas")).toBeInTheDocument();
      expect(screen.getByLabelText("close menu")).toBeInTheDocument();
    });

    it("deve fechar menu mobile ao clicar no botão de fechar", () => {
      renderWithProviders(
        <SideMenu isMobile={true} mobileOpen={true} onMobileClose={mockOnMobileClose} />
      );
      const closeButton = screen.getByLabelText("close menu");
      fireEvent.click(closeButton);
      expect(mockOnMobileClose).toHaveBeenCalledTimes(1);
    });

    it("deve fechar menu mobile ao clicar em um item do menu", () => {
      renderWithProviders(
        <SideMenu isMobile={true} mobileOpen={true} onMobileClose={mockOnMobileClose} />
      );
      const salesButton = screen.getByText("Vendas");
      fireEvent.click(salesButton);
      expect(mockOnMobileClose).toHaveBeenCalledTimes(1);
    });

    it("não deve exibir botão de toggle em mobile", () => {
      renderWithProviders(
        <SideMenu isMobile={true} mobileOpen={true} onMobileClose={mockOnMobileClose} />
      );
      expect(screen.queryByLabelText("toggle menu")).not.toBeInTheDocument();
    });
  });

  describe("Comportamento Desktop", () => {
    it("deve manter comportamento de toggle em desktop", () => {
      renderWithProviders(<SideMenu isMobile={false} />);
      const toggleButton = screen.getByLabelText("toggle menu");
      expect(toggleButton).toBeInTheDocument();
      
      // Primeiro expande o menu
      fireEvent.click(toggleButton);
      expect(screen.getByText("Vendas")).toBeInTheDocument();
      
      // Depois recolhe
      fireEvent.click(toggleButton);
      const vendasText = screen.queryByText("Vendas");
      expect(vendasText).not.toBeVisible();
    });

    it("não deve fechar menu ao clicar em item em desktop", () => {
      const mockOnMobileClose = jest.fn();
      renderWithProviders(
        <SideMenu isMobile={false} onMobileClose={mockOnMobileClose} />
      );
      const toggleButton = screen.getByLabelText("toggle menu");
      fireEvent.click(toggleButton);
      const salesButton = screen.getByText("Vendas");
      fireEvent.click(salesButton);
      expect(mockOnMobileClose).not.toHaveBeenCalled();
    });
  });
});
