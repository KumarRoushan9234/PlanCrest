import crypto from "crypto";
import jwt from "jsonwebtoken";
import { HttpError } from "../utils/workspaceAccess.js";
import { bearer, call } from "./http.js";
import { getProvider, redirectUri } from "./registry.js";

const GROUPS = {
  google: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    id: "GOOGLE_CLIENT_ID",
    secret: "GOOGLE_CLIENT_SECRET",
  },
  github: {
    authUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    id: "GITHUB_CLIENT_ID",
    secret: "GITHUB_CLIENT_SECRET",
  },
  slack: {
    authUrl: "https://slack.com/oauth/v2/authorize",
    tokenUrl: "https://slack.com/api/oauth.v2.access",
    id: "SLACK_CLIENT_ID",
    secret: "SLACK_CLIENT_SECRET",
  },
};

export const isOAuthGroup = (group) => Boolean(GROUPS[group]);

/** OAuth `state` is a short-lived signed token so callbacks can trust what it says. */
export const signState = (payload) =>
  jwt.sign({ ...payload, nonce: crypto.randomBytes(12).toString("hex") }, process.env.JWT_SECRET, {
    expiresIn: "10m",
    audience: "oauth-state",
  });

export const verifyState = (state) => {
  try {
    return jwt.verify(String(state), process.env.JWT_SECRET, { audience: "oauth-state" });
  } catch {
    return null;
  }
};

export const buildAuthUrl = (providerId, state) => {
  const provider = getProvider(providerId);
  const group = GROUPS[provider.oauthGroup];
  const params = new URLSearchParams({
    client_id: process.env[group.id],
    redirect_uri: redirectUri(provider.oauthGroup),
    state,
  });

  if (provider.oauthGroup === "google") {
    params.set("response_type", "code");
    params.set("scope", ["openid", "email", "profile", ...provider.scopes].join(" "));
    params.set("access_type", "offline"); // we need a refresh token
    params.set("prompt", "consent");
    params.set("include_granted_scopes", "true");
  } else if (provider.oauthGroup === "github") {
    params.set("scope", provider.scopes.join(" "));
  } else if (provider.oauthGroup === "slack") {
    params.set("scope", provider.scopes.join(","));
  }
  return `${group.authUrl}?${params.toString()}`;
};

/** Exchange an authorization code for tokens, normalised across providers. */
export const exchangeCode = async (providerId, code) => {
  const provider = getProvider(providerId);
  const group = GROUPS[provider.oauthGroup];
  const body = new URLSearchParams({
    client_id: process.env[group.id],
    client_secret: process.env[group.secret],
    code,
    redirect_uri: redirectUri(provider.oauthGroup),
  });
  if (provider.oauthGroup === "google") body.set("grant_type", "authorization_code");

  const data = await call({
    method: "POST",
    url: group.tokenUrl,
    data: body.toString(),
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
  });

  if (data.error || data.ok === false) {
    throw new HttpError(400, data.error_description || data.error || "The provider rejected the authorization code");
  }
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiryDate: data.expires_in ? Date.now() + data.expires_in * 1000 : undefined,
    scopes: String(data.scope || "").split(/[ ,]+/).filter(Boolean),
    raw: data,
  };
};

/** Who connected? Used to label the connection in the UI. */
export const fetchAccount = async (providerId, tokens) => {
  const provider = getProvider(providerId);
  if (provider.oauthGroup === "google") {
    const info = await call({ url: "https://www.googleapis.com/oauth2/v2/userinfo", headers: bearer(tokens.accessToken) });
    return { id: info.id, email: info.email, name: info.name, picture: info.picture, label: info.email };
  }
  if (provider.oauthGroup === "github") {
    const user = await call({
      url: "https://api.github.com/user",
      headers: bearer(tokens.accessToken, { Accept: "application/vnd.github+json" }),
    });
    return { id: String(user.id), email: user.email, name: user.name || user.login, picture: user.avatar_url, username: user.login, label: `@${user.login}` };
  }
  if (provider.oauthGroup === "slack") {
    const team = tokens.raw.team || {};
    return { id: team.id, name: team.name, label: team.name || "Slack workspace" };
  }
  return { label: provider.name };
};

export const refreshGoogleAccessToken = async (refreshToken) => {
  const group = GROUPS.google;
  const data = await call({
    method: "POST",
    url: group.tokenUrl,
    data: new URLSearchParams({
      client_id: process.env[group.id],
      client_secret: process.env[group.secret],
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }).toString(),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return { accessToken: data.access_token, expiryDate: Date.now() + (data.expires_in || 3600) * 1000 };
};
