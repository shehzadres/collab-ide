import { useEffect, useRef, useState } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useAuthStore } from "../../store/authStore";

export function ProtectedRoute() {
  const { bootstrap } = useAuth();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [checked, setChecked] = useState(false);
  const ranRef = useRef(false);

  useEffect(() => {
    if (ranRef.current) return;
    ranRef.current = true;

    // If the store already has an authenticated user (e.g. navigated here
    // immediately after register/login which already populated the store),
    // skip the bootstrap refresh entirely — calling /auth/refresh right after
    // /auth/register would consume the newly-issued refresh token and could
    // fail due to cookie timing on cross-origin dev setups.
    if (isAuthenticated) {
      setChecked(true);
      return;
    }

    // No unmount-guard flag here on purpose: ranRef above already makes this
    // block run exactly once per real mount, so there's nothing to "cancel"
    // when React 18 StrictMode replays effect setup/cleanup in dev — a
    // closure-scoped `cancelled` flip in that cleanup would flip *after*
    // ranRef has already locked out a second run, permanently starving the
    // still-in-flight bootstrap() promise's .finally() and leaving `checked`
    // stuck at false forever (infinite "Loading..."). React 18 safely no-ops
    // setState on a truly unmounted component, so calling setChecked
    // unconditionally here is safe in both cases.
    bootstrap().finally(() => {
      setChecked(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!checked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg text-muted text-sm">
        Loading...
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
}
