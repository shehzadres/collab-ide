export function AppRouteLoading() {
  return (
    <main className="app-route-loading" role="status" aria-live="polite">
      <span className="app-route-loading-mark" aria-hidden="true" />
      <span>Preparing your workspace</span>
    </main>
  );
}
