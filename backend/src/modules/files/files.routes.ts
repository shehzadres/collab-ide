import { Router } from "express";
import { filesController } from "./files.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { apiRateLimit, fileWriteRateLimit } from "../../middleware/rateLimit.middleware";
import { requireSessionRole } from "../permissions/permissions.middleware";
import { requireFileSessionRole, attachFileSessionMembership } from "../permissions/file.permissions.middleware";

const router = Router();

router.use(authMiddleware);
router.use(apiRateLimit);

// Creating a file requires at least EDITOR in that session. sessionId comes
// from the request body here (no :sessionId route param on POST /), which
// requireSessionRole already knows to fall back to via resolveSessionId.
router.post("/", fileWriteRateLimit, requireSessionRole("EDITOR"), filesController.create.bind(filesController));

// Viewing the tree auto-enrolls the caller (as VIEWER if no role specified
// elsewhere) rather than rejecting — visiting a session's workspace and
// seeing its file list is intended to be the on-ramp to membership, not
// something that requires a pre-existing invite to even load.
router.get("/tree/:sessionId", attachFileSessionMembership("VIEWER"), filesController.getTree.bind(filesController));

// Reading a specific file's content has the same auto-enroll-as-VIEWER
// behavior as the tree view, for the same reason: a first-time visitor who
// has never hit /tree (e.g. opened a deep link directly to a file) would
// otherwise be rejected before they have any membership row to check
// against.
router.get("/:id", attachFileSessionMembership("VIEWER"), filesController.getById.bind(filesController));
router.patch("/:id", fileWriteRateLimit, requireFileSessionRole("EDITOR"), filesController.update.bind(filesController));
router.patch("/:id/move", fileWriteRateLimit, requireFileSessionRole("EDITOR"), filesController.move.bind(filesController));
router.delete("/:id", fileWriteRateLimit, requireFileSessionRole("EDITOR"), filesController.delete.bind(filesController));

export default router;
