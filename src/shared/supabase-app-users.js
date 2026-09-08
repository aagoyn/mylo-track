import { supabase } from "./supabase-client.js";

export async function getUserByUsername(username) {
  const { data, error } = await supabase
    .from("app_users")
    .select("username, password_hash, password_salt, phone")
    .eq("username", username)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function getAllUserPhones() {
  const { data, error } = await supabase.from("app_users").select("phone");
  if (error) throw error;
  return data.map((row) => String(row.phone));
}

export async function createUser({ username, passwordHash, passwordSalt, phone }) {
  const { error } = await supabase.from("app_users").insert({
    username,
    password_hash: passwordHash,
    password_salt: passwordSalt,
    phone,
  });
  if (error) throw error;
}
