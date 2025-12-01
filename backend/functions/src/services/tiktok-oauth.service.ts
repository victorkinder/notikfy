import { logger } from "../utils/logger";
import { ValidationError } from "../utils/errors";
import { encrypt, decrypt } from "../utils/encryption";
import { Timestamp } from "firebase-admin/firestore";
import {
  TikTokProfile,
  TikTokProfileOAuth,
} from "../models/tiktok-profile.model";

const TIKTOK_AUTH_BASE_URL = "https://auth.tiktok-shops.com";
const TIKTOK_API_BASE_URL = "https://open-api.tiktokglobalshop.com";

/**
 * Interface para resposta de token OAuth do TikTok
 */
interface TikTokTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  scope?: string;
}

/**
 * Interface para informações da loja do TikTok
 */
interface TikTokShopInfo {
  shop_id: string;
  shop_name?: string;
  region?: string;
}

/**
 * Gera URL de autorização OAuth do TikTok Shop
 */
export function generateAuthUrl(
  clientKey: string,
  redirectUri: string,
  state: string,
  scopes: string[] = ["shop.order.read", "shop.order.write"]
): string {
  const scope = scopes.join(",");
  const params = new URLSearchParams({
    app_key: clientKey,
    redirect_uri: redirectUri,
    state: state,
    scope: scope,
  });

  return `${TIKTOK_AUTH_BASE_URL}/oauth/authorize?${params.toString()}`;
}

/**
 * Troca código de autorização por access token
 */
export async function exchangeCodeForToken(
  clientKey: string,
  clientSecret: string,
  code: string,
  redirectUri: string
): Promise<TikTokTokenResponse> {
  const url = `${TIKTOK_API_BASE_URL}/api/v2/token/get`;

  const body = {
    app_key: clientKey,
    app_secret: clientSecret,
    auth_code: code,
    grant_type: "authorized_code",
    redirect_uri: redirectUri,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Erro ao trocar código por token", {
        status: response.status,
        error: errorText,
      });
      throw new ValidationError(
        `Falha ao obter token do TikTok: ${response.status} ${errorText}`
      );
    }

    const data = await response.json();

    // TikTok retorna dados em diferentes formatos dependendo da API
    if (data.error) {
      throw new ValidationError(
        `Erro do TikTok: ${data.error.message || data.error}`
      );
    }

    // Normaliza resposta para formato esperado
    const tokenResponse: TikTokTokenResponse = {
      access_token: data.data?.access_token || data.access_token,
      refresh_token: data.data?.refresh_token || data.refresh_token,
      expires_in: data.data?.expires_in || data.expires_in || 3600,
      token_type: data.data?.token_type || data.token_type || "Bearer",
      scope: data.data?.scope || data.scope,
    };

    if (!tokenResponse.access_token) {
      throw new ValidationError("Token de acesso não retornado pelo TikTok");
    }

    return tokenResponse;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.error("Erro ao trocar código por token", error);
    throw new ValidationError("Falha ao comunicar com API do TikTok");
  }
}

/**
 * Renova access token usando refresh token
 */
export async function refreshAccessToken(
  clientKey: string,
  clientSecret: string,
  refreshToken: string
): Promise<TikTokTokenResponse> {
  const url = `${TIKTOK_API_BASE_URL}/api/v2/token/refresh`;

  const body = {
    app_key: clientKey,
    app_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Erro ao renovar token", {
        status: response.status,
        error: errorText,
      });
      throw new ValidationError(
        `Falha ao renovar token do TikTok: ${response.status}`
      );
    }

    const data = await response.json();

    if (data.error) {
      throw new ValidationError(
        `Erro do TikTok: ${data.error.message || data.error}`
      );
    }

    const tokenResponse: TikTokTokenResponse = {
      access_token: data.data?.access_token || data.access_token,
      refresh_token: data.data?.refresh_token || data.refresh_token,
      expires_in: data.data?.expires_in || data.expires_in || 3600,
      token_type: data.data?.token_type || data.token_type || "Bearer",
      scope: data.data?.scope || data.scope,
    };

    if (!tokenResponse.access_token) {
      throw new ValidationError("Token de acesso não retornado pelo TikTok");
    }

    return tokenResponse;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.error("Erro ao renovar token", error);
    throw new ValidationError("Falha ao comunicar com API do TikTok");
  }
}

/**
 * Obtém informações da loja usando access token
 */
export async function getShopInfo(
  accessToken: string
): Promise<TikTokShopInfo> {
  const url = `${TIKTOK_API_BASE_URL}/api/v2/shop/get_shop_info`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error("Erro ao obter informações da loja", {
        status: response.status,
        error: errorText,
      });
      throw new ValidationError(
        `Falha ao obter informações da loja: ${response.status}`
      );
    }

    const data = await response.json();

    if (data.error) {
      throw new ValidationError(
        `Erro do TikTok: ${data.error.message || data.error}`
      );
    }

    // Normaliza resposta
    const shopInfo: TikTokShopInfo = {
      shop_id: data.data?.shop_id || data.shop_id,
      shop_name: data.data?.shop_name || data.shop_name,
      region: data.data?.region || data.region,
    };

    if (!shopInfo.shop_id) {
      throw new ValidationError("ID da loja não retornado pelo TikTok");
    }

    return shopInfo;
  } catch (error) {
    if (error instanceof ValidationError) {
      throw error;
    }
    logger.error("Erro ao obter informações da loja", error);
    throw new ValidationError("Falha ao comunicar com API do TikTok");
  }
}

/**
 * Cria objeto OAuth criptografado a partir de token response
 */
export function createOAuthData(
  tokenResponse: TikTokTokenResponse,
  shopId?: string
): TikTokProfileOAuth {
  const now = Timestamp.now();
  const expiresIn = tokenResponse.expires_in || 3600; // Default 1 hora
  const expiresAt = new Date(now.toMillis() + expiresIn * 1000);

  return {
    accessToken: encrypt(tokenResponse.access_token),
    refreshToken: tokenResponse.refresh_token
      ? encrypt(tokenResponse.refresh_token)
      : undefined,
    expiresAt: Timestamp.fromDate(expiresAt),
    shopId: shopId,
    isConnected: true,
    connectedAt: now,
  };
}

/**
 * Obtém access token descriptografado do perfil
 */
export function getDecryptedAccessToken(profile: TikTokProfile): string | null {
  if (!profile.oauth?.accessToken) {
    return null;
  }

  try {
    return decrypt(profile.oauth.accessToken);
  } catch (error) {
    logger.error("Erro ao descriptografar access token", error);
    return null;
  }
}

/**
 * Obtém refresh token descriptografado do perfil
 */
export function getDecryptedRefreshToken(
  profile: TikTokProfile
): string | null {
  if (!profile.oauth?.refreshToken) {
    return null;
  }

  try {
    return decrypt(profile.oauth.refreshToken);
  } catch (error) {
    logger.error("Erro ao descriptografar refresh token", error);
    return null;
  }
}
