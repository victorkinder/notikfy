import { render, screen, fireEvent } from "@testing-library/react";
import { Header } from "../Header";
import { ThemeContextProvider } from "../../../../context/ThemeContext";

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

const renderWithTheme = (component: React.ReactElement) => {
  return render(<ThemeContextProvider>{component}</ThemeContextProvider>);
};

describe("Header", () => {
  it("deve renderizar o título Notikfy", () => {
    renderWithTheme(<Header />);
    expect(screen.getByText("NoTikFy")).toBeInTheDocument();
  });

  it("deve ter uma AppBar", () => {
    renderWithTheme(<Header />);
    const appBar = screen.getByRole("banner");
    expect(appBar).toBeInTheDocument();
  });

  it("não deve exibir botão de menu quando showMenuButton é false", () => {
    renderWithTheme(<Header showMenuButton={false} />);
    expect(screen.queryByLabelText("abrir menu")).not.toBeInTheDocument();
  });

  it("deve exibir botão de menu quando showMenuButton é true", () => {
    renderWithTheme(<Header showMenuButton={true} />);
    expect(screen.getByLabelText("abrir menu")).toBeInTheDocument();
  });

  it("deve chamar onMenuClick ao clicar no botão de menu", () => {
    const mockOnMenuClick = jest.fn();
    renderWithTheme(<Header showMenuButton={true} onMenuClick={mockOnMenuClick} />);
    const menuButton = screen.getByLabelText("abrir menu");
    fireEvent.click(menuButton);
    expect(mockOnMenuClick).toHaveBeenCalledTimes(1);
  });
});
