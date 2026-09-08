import crypto from "node:crypto";
import { faviconLink } from "./dashboard-layout.js";

const SESSION_SECRET = process.env.SESSION_SECRET || "";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 hari
const COOKIE_NAME = "session";
const IS_PRODUCTION = process.env.NODE_ENV === "production" || Boolean(process.env.RENDER);

function sign(value) {
  return crypto.createHmac("sha256", SESSION_SECRET).update(value).digest("hex");
}

function safeEqual(a, b) {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

function parseCookies(header) {
  const cookies = {};
  if (!header) return cookies;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    cookies[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
  }
  return cookies;
}

// session nyimpen identitas user (username + phone) biar dashboard tau data siapa yang ditampilin
export function createSessionCookie({ username, phone }) {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const payloadB64 = Buffer.from(JSON.stringify({ username, phone, expiresAt })).toString(
    "base64url"
  );
  const token = `${payloadB64}.${sign(payloadB64)}`;
  const secure = IS_PRODUCTION ? "; Secure" : "";
  return `${COOKIE_NAME}=${token}; HttpOnly; Path=/; Max-Age=${Math.floor(SESSION_TTL_MS / 1000)}; SameSite=Lax${secure}`;
}

export function clearSessionCookie() {
  const secure = IS_PRODUCTION ? "; Secure" : "";
  return `${COOKIE_NAME}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${secure}`;
}

export function getSession(req) {
  const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
  if (!token) return null;

  const [payloadB64, signature] = token.split(".");
  if (!payloadB64 || !signature) return null;
  if (!safeEqual(signature, sign(payloadB64))) return null;

  let data;
  try {
    data = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8"));
  } catch {
    return null;
  }

  if (!data.expiresAt || Date.now() >= data.expiresAt) return null;
  return data;
}

export function requireAuth(req, res, next) {
  const session = getSession(req);
  if (!session) return res.redirect("/login");
  req.user = session;
  next();
}

export function loginPageHtml(error) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Login</title>
${faviconLink("/icons/login.png")}
<style>
  body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
  form { background: #1e293b; padding: 32px; border-radius: 12px; width: 280px; box-shadow: 0 10px 30px rgba(0,0,0,.3); }
  h1 { font-size: 18px; margin: 0 0 16px; }
  input { width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid #334155; background: #0f172a; color: #e2e8f0; box-sizing: border-box; margin-bottom: 12px; font-size: 14px; }
  button { width: 100%; padding: 10px 12px; border-radius: 8px; border: none; background: #6366f1; color: white; font-size: 14px; cursor: pointer; }
  button:hover { background: #4f46e5; }
  .error { color: #f87171; font-size: 13px; margin-bottom: 12px; }
</style>
</head>
<body>
  <form method="POST" action="/login">
    <h1>🔒 Log In</h1>
    ${error ? `<div class="error">${error}</div>` : ""}
    <input type="text" name="username" placeholder="Username" autofocus required>
    <input type="password" name="password" placeholder="Password" required>
    <button type="submit">Log In</button>
  </form>
</body>
</html>`;
}
