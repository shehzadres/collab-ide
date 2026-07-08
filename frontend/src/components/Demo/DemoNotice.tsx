import { Info } from "lucide-react";

/**
 * A slim, non-intrusive banner shown at the top of the workspace when the
 * app is running in DEMO_MODE. It informs users that code execution is
 * disabled on the hosted demo because free hosting platforms do not support
 * Docker sandbox execution, and points them to the source repo for the full
 * experience.
 */
export function DemoNotice() {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-accent/10 border-b border-accent/20 text-xs text-ink/80">
      <Info size={13} strokeWidth={1.75} className="shrink-0 text-accent" />
      <span>
        <span className="font-semibold text-accent">Hosted demo —</span> code execution (terminal, run, install)
        is disabled because free hosting platforms do not support Docker sandbox environments.{" "}
        <a
          href="https://github.com/shahzadlone/collab-ide"
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-ink"
        >
          Run locally
        </a>{" "}
        for the full experience. All other features are fully operational.
      </span>
    </div>
  );
}
