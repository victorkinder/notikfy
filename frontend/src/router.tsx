import { createBrowserRouter, Navigate } from "react-router-dom";
import { Login } from "./pages/Login/Login";
import { Sales } from "./pages/Sales/Sales";
import { Settings } from "./pages/Settings/Settings";
import { Activation } from "./pages/Activation/Activation";
import { TikTokProfiles } from "./pages/TikTokProfiles/TikTokProfiles";
import { ProtectedRoute } from "./components/common/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/sales" replace />,
  },
  {
    path: "/sales",
    element: (
      <ProtectedRoute>
        <Sales />
      </ProtectedRoute>
    ),
  },
  {
    path: "/settings",
    element: (
      <ProtectedRoute>
        <Settings />
      </ProtectedRoute>
    ),
  },
  {
    path: "/activation",
    element: (
      <ProtectedRoute requireActivation={false}>
        <Activation />
      </ProtectedRoute>
    ),
  },
  {
    path: "/tiktok-profiles",
    element: (
      <ProtectedRoute>
        <TikTokProfiles />
      </ProtectedRoute>
    ),
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "*",
    element: <Navigate to="/sales" replace />,
  },
]);
