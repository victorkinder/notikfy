import { RouterProvider } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { ThemeContextProvider } from "./context/ThemeContext";
import { AuthContextProvider } from "./context/AuthContext";
import { ActivationContextProvider } from "./context/ActivationContext";
import { TikTokProfileContextProvider } from "./context/TikTokProfileContext";
import { NotificationContextProvider } from "./context/NotificationContext";
import { router } from "./router";
import "./styles/fonts.css";
import "./styles/global.css";
import "./styles/notifications.css";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <ErrorBoundary>
      <ThemeContextProvider>
        <NotificationContextProvider>
          <AuthContextProvider>
            <ActivationContextProvider>
              <TikTokProfileContextProvider>
                <RouterProvider router={router} />
                <ToastContainer
                  position="top-right"
                  autoClose={5000}
                  hideProgressBar={false}
                  newestOnTop={false}
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                  theme="colored"
                  toastClassName="toast-custom"
                />
              </TikTokProfileContextProvider>
            </ActivationContextProvider>
          </AuthContextProvider>
        </NotificationContextProvider>
      </ThemeContextProvider>
    </ErrorBoundary>
  );
}

export default App;
