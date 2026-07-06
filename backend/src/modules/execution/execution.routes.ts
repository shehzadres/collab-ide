import { Router } from "express";
import { executionController } from "./execution.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { apiRateLimit } from "../../middleware/rateLimit.middleware";
import { attachSessionMembership, requireSessionRole } from "../permissions/permissions.middleware";

const router = Router();

router.use(authMiddleware);
router.use(apiRateLimit);

// Viewing config only requires membership (auto-enrolled on first touch),
// matching how file-tree GETs work — anyone who can see the workspace can
// see what runtime it's configured for.
router.get("/:sessionId", attachSessionMembership(), executionController.getConfig.bind(executionController));

// Changing runtime is an EDITOR+ action, like file mutations.
router.patch(
  "/:sessionId/runtime",
  requireSessionRole("EDITOR"),
  executionController.updateRuntime.bind(executionController)
);

// Enabling/disabling network access is a security-relevant decision
// (see docker.runner.ts) — restricted to OWNER+, deliberately stricter
// than runtime selection above.
router.patch(
  "/:sessionId/network",
  requireSessionRole("OWNER"),
  executionController.updateNetworkAccess.bind(executionController)
);

router.post(
  "/:sessionId/reset",
  requireSessionRole("OWNER"),
  executionController.resetWorkspace.bind(executionController)
);

router.post(
  "/:sessionId/run",
  requireSessionRole("EDITOR"),
  executionController.runFile.bind(executionController)
);

router.post(
  "/:sessionId/install",
  requireSessionRole("EDITOR"),
  executionController.installPackages.bind(executionController)
);

export default router;
