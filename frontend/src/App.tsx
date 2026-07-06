import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import SessionsPage from "./pages/SessionsPage";
import WorkspacePage from "./pages/WorkspacePage";
import InviteRedeemPage from "./pages/InviteRedeemPage";
import { ProtectedRoute } from "./components/Auth/ProtectedRoute";
import { CommandPalette } from "./components/CommandPalette/CommandPalette";
import { ToastContainer } from "./components/Notifications/ToastContainer";
import { useTheme } from "./hooks/useTheme";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

export default function App() {
  // Applies the persisted theme's CSS variables on every load, before any
  // route renders, so there's no flash-of-wrong-theme on refresh.
  useTheme();
  useKeyboardShortcuts();

  return (
    <BrowserRouter>
      <CommandPalette />
      <ToastContainer />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/sessions" element={<SessionsPage />} />
          <Route path="/workspace/:sessionId" element={<WorkspacePage />} />
          <Route path="/invite/:token" element={<InviteRedeemPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
