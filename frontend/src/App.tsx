import { RouterProvider } from "react-router-dom";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { ThemeContextProvider } from "./context/ThemeContext";
import { AuthContextProvider } from "./context/AuthContext";
import { ActivationContextProvider } from "./context/ActivationContext";
import { router } from "./router";
import "./styles/fonts.css";
import "./styles/global.css";

function App() {
  return (
    <ErrorBoundary>
      <ThemeContextProvider>
        <AuthContextProvider>
          <ActivationContextProvider>
            <RouterProvider router={router} />
          </ActivationContextProvider>
        </AuthContextProvider>
      </ThemeContextProvider>
    </ErrorBoundary>
  );
}

export default App;
