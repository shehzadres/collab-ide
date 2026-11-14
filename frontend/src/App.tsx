import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ProtectedRoute } from "./components/Auth/ProtectedRoute";
import { CommandPalette } from "./components/CommandPalette/CommandPalette";
import { ToastContainer } from "./components/Notifications/ToastContainer";
import { AppRouteLoading } from "./components/AppRouteLoading";
import { useTheme } from "./hooks/useTheme";
import { useKeyboardShortcuts } from "./hooks/useKeyboardShortcuts";

const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const SessionsPage = lazy(() => import("./pages/SessionsPage"));
const WorkspacePage = lazy(() => import("./pages/WorkspacePage"));
const InviteRedeemPage = lazy(() => import("./pages/InviteRedeemPage"));

export default function App() {
  useTheme();
  useKeyboardShortcuts();

  return (
    <BrowserRouter>
      <CommandPalette />
      <ToastContainer />
      <Suspense fallback={<AppRouteLoading />}>
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
      </Suspense>
    </BrowserRouter>
  );
}
