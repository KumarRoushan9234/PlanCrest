import express from "express";
import { catalog, connectWithCredentials, disconnect, oauthCallback, runAction, startOAuth, updateConnector } from "../controllers/integrations.js";
import { handleGithubWebhook } from "../integrations/providers/github.js";
import { requireSignin } from "../middlewares/index.js";
import { authLimiter } from "../middlewares/security.js";

const router = express.Router();

// Public: the provider redirects the browser here, and GitHub posts webhooks here.
// Both prove themselves (signed state / HMAC signature), not with a session.
router.get("/integrations/:group/callback", oauthCallback);
router.post("/integrations/github/webhook", handleGithubWebhook);

router.get("/integrations", requireSignin, catalog);
router.post("/integrations/:provider/connect", requireSignin, authLimiter, startOAuth);
router.post("/integrations/:provider/credentials", requireSignin, authLimiter, connectWithCredentials);
router.patch("/integrations/connectors/:id", requireSignin, updateConnector);
router.delete("/integrations/connectors/:id", requireSignin, disconnect);
router.post("/integrations/connectors/:id/actions/:action", requireSignin, runAction);

export default router;
