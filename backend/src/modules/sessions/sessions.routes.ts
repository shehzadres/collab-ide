import { Router } from "express";
import { sessionsController } from "./sessions.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { apiRateLimit } from "../../middleware/rateLimit.middleware";
import { attachSessionMembership, requireSessionRole } from "../permissions/permissions.middleware";
import { requireRecordingSessionRole } from "../permissions/recording.permissions.middleware";

const router = Router();

router.use(authMiddleware);
router.use(apiRateLimit);

// Starting/stopping a recording requires OWNER+ in *that session* — not the
// old global User.role check, which couldn't distinguish "OWNER of session A"
// from "OWNER of session B" since the role lived on the user record itself
// rather than per-membership.
router.post("/:sessionId/start", requireSessionRole("OWNER"), sessionsController.start.bind(sessionsController));
router.post("/:sessionId/stop", requireSessionRole("OWNER"), sessionsController.stop.bind(sessionsController));

// Viewing the recordings list only requires membership (auto-enrolled as
// VIEWER if new) — any participant in a session should be able to see what
// recordings exist for it.
router.get("/:sessionId/recordings", attachSessionMembership("VIEWER"), sessionsController.list.bind(sessionsController));

// Replay viewing requires at-least-VIEWER in the recording's session,
// resolved via the recording row itself since recordingId is the only
// identifier in this route's URL.
router.get("/recordings/:recordingId/replay", requireRecordingSessionRole("VIEWER"), sessionsController.replay.bind(sessionsController));
router.delete("/recordings/:recordingId", requireRecordingSessionRole("OWNER"), sessionsController.remove.bind(sessionsController));

export default router;
