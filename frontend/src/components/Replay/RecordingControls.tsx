import { useSessionRecording } from "../../hooks/useSessionRecording";

interface RecordingControlsProps {
  sessionId: string;
}

export function RecordingControls({ sessionId }: RecordingControlsProps) {
  const { isRecording, start, stop } = useSessionRecording(sessionId);

  return (
    <button
      onClick={() => (isRecording ? stop() : start())}
      className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium ${
        isRecording ? "bg-danger/20 text-danger" : "bg-hover text-ink hover:bg-active"
      }`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isRecording ? "bg-danger animate-pulse" : "bg-faint"}`} />
      {isRecording ? "Stop recording" : "Record session"}
    </button>
  );
}
