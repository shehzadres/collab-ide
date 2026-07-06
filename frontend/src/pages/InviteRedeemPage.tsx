import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { permissionsApi } from "../lib/api/permissions.api";

export default function InviteRedeemPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"pending" | "error">("pending");
  const [message, setMessage] = useState("Joining session...");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("This invite link is invalid.");
      return;
    }

    permissionsApi
      .redeemInvite(token)
      .then(({ sessionId }) => {
        navigate(`/workspace/${encodeURIComponent(sessionId)}`, { replace: true });
      })
      .catch((err) => {
        setStatus("error");
        setMessage(err?.response?.data?.message || "This invite link could not be used.");
      });
  }, [token, navigate]);

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center">
      <div className="text-center">
        <p className={`text-sm ${status === "error" ? "text-danger" : "text-muted"}`}>{message}</p>
        {status === "error" && (
          <button
            onClick={() => navigate("/sessions")}
            className="mt-4 text-xs text-accent hover:opacity-80"
          >
            Back to sessions
          </button>
        )}
      </div>
    </div>
  );
}
