import { Router } from "express";
import { permissionsController } from "./permissions.controller";
import { authMiddleware } from "../../middleware/auth.middleware";
import { apiRateLimit } from "../../middleware/rateLimit.middleware";
import { attachSessionMembership } from "./permissions.middleware";

const router = Router();

router.use(authMiddleware);
router.use(apiRateLimit);

router.get("/:sessionId/members", attachSessionMembership("VIEWER"), permissionsController.listMembers.bind(permissionsController));
router.get("/:sessionId/me", attachSessionMembership("VIEWER"), permissionsController.myRole.bind(permissionsController));
router.patch("/:sessionId/members/:userId", permissionsController.updateMemberRole.bind(permissionsController));
router.delete("/:sessionId/members/:userId", permissionsController.removeMember.bind(permissionsController));

router.post("/:sessionId/invites", permissionsController.createInvite.bind(permissionsController));
router.get("/:sessionId/invites", permissionsController.listInvites.bind(permissionsController));
router.delete("/invites/:inviteId", permissionsController.revokeInvite.bind(permissionsController));

// Redeeming is not scoped under :sessionId since the token alone identifies
// the session — this is the route the frontend hits when someone clicks a
// shared invite link.
router.post("/invites/:token/redeem", permissionsController.redeemInvite.bind(permissionsController));

export default router;
