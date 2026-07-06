import { useParams, useSearchParams } from "react-router-dom";
import { Workspace } from "../components/Layout/Workspace";
import { ReplayRoute } from "../components/Replay/ReplayRoute";

export default function WorkspacePage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const [searchParams] = useSearchParams();
  const recordingId = searchParams.get("replay");

  if (!sessionId) {
    return (
      <div className="flex h-screen items-center justify-center text-faint text-sm">
        No session selected
      </div>
    );
  }

  if (recordingId) {
    return (
      <div className="flex h-screen w-screen bg-bg">
        <ReplayRoute sessionId={sessionId} recordingId={recordingId} />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-bg">
      <Workspace roomId={sessionId} />
    </div>
  );
}
