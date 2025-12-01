// Exporta todas as functions
export { healthCheck } from "./webhooks/healthCheck";
export { helloWorld } from "./webhooks/helloWorld";
export { activateKey } from "./activation/activateKey";
export { purchasePlan } from "./activation/purchasePlan";
export { kiwifyWebhook } from "./webhooks/kiwifyWebhook";
export { validateAccessToken } from "./auth/validateAccessToken";
export { debugEnv } from "./webhooks/debugEnv"; // TEMPORÁRIO - Remover após debug

// https://us-central1-minerx-app-login.cloudfunctions.net/healthCheck
// https://us-central1-minerx-app-login.cloudfunctions.net/debugEnv (TEMPORÁRIO)
