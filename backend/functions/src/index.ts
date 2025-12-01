// Exporta todas as functions
export { healthCheck } from "./webhooks/healthCheck";
export { helloWorld } from "./webhooks/helloWorld";
export { activateKey } from "./activation/activateKey";
export { purchasePlan } from "./activation/purchasePlan";
export { kiwifyWebhook } from "./webhooks/kiwifyWebhook";
export { validateAccessToken } from "./auth/validateAccessToken";
export { debugEnv } from "./webhooks/debugEnv"; // TEMPORÁRIO - Remover após debug
export {
  getTikTokProfiles,
  addTikTokProfile,
  removeTikTokProfile,
} from "./tiktok-profiles/manageProfiles";
export { updateNotificationSettingsFunction as updateNotificationSettings } from "./settings/updateNotificationSettings";
export { saleWebhook } from "./webhooks/saleWebhook";
export { processNotificationTask } from "./tasks/processNotificationTask";
export { initiateOAuth } from "./tiktok-oauth/initiateOAuth";
export { oauthCallback } from "./tiktok-oauth/oauthCallback";
export { disconnectTikTok } from "./tiktok-oauth/disconnectTikTok";
export { getConnectionStatus } from "./tiktok-oauth/getConnectionStatus";
export { tiktokWebhook } from "./webhooks/tiktokWebhook";

// https://us-central1-minerx-app-login.cloudfunctions.net/healthCheck
// https://us-central1-minerx-app-login.cloudfunctions.net/debugEnv (TEMPORÁRIO)
