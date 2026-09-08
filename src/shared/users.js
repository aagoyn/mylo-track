import crypto from "node:crypto";
import { getUserByUsername, getAllUserPhones, createUser } from "./supabase-app-users.js";

function hashPassword(password, salt) {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

export function makeCredentials(password) {
  const passwordSalt = crypto.randomBytes(16).toString("hex");
  const passwordHash = hashPassword(password, passwordSalt);
  return { passwordHash, passwordSalt };
}

export async function verifyLogin(username, password) {
  if (!username || !password) return null;

  const user = await getUserByUsername(username);
  if (!user) return null;

  const candidate = Buffer.from(hashPassword(password, user.password_salt), "hex");
  const stored = Buffer.from(user.password_hash, "hex");
  if (candidate.length !== stored.length || !crypto.timingSafeEqual(candidate, stored)) {
    return null;
  }

  return { username: user.username, phone: user.phone };
}

// cache singkat biar nggak query DB tiap ada pesan Telegram masuk
let cachedChatIds = null;
let cachedAt = 0;
const CACHE_TTL_MS = 30_000;

export async function getAllowedChatIds() {
  const now = Date.now();
  if (cachedChatIds && now - cachedAt < CACHE_TTL_MS) return cachedChatIds;
  cachedChatIds = await getAllUserPhones();
  cachedAt = now;
  return cachedChatIds;
}

// dipakai buat nambah user baru (lewat script sekali-jalan, bukan lewat web)
export async function addUser(username, password, phone) {
  const { passwordHash, passwordSalt } = makeCredentials(password);
  await createUser({ username, passwordHash, passwordSalt, phone });
}
