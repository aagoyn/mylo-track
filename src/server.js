import "dotenv/config";
import express from "express";
import { requireAuth, createSessionCookie, clearSessionCookie, loginPageHtml } from "./shared/auth.js";
import { verifyLogin } from "./shared/users.js";
import { router as spendingRouter, registerCommands as registerSpendingCommands } from "./spending/router.js";
import { router as calorieRouter, registerCommands as registerCalorieCommands } from "./calorie/router.js";
import { router as hubRouter } from "./hub/router.js";

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => res.send("ok"));

app.get("/login", (req, res) => {
  res.send(loginPageHtml());
});

app.post("/login", async (req, res) => {
  try {
    const user = await verifyLogin(req.body.username, req.body.password);
    if (!user) return res.send(loginPageHtml("Username atau password salah."));

    res.setHeader("Set-Cookie", createSessionCookie(user));
    res.redirect("/hub");
  } catch (err) {
    console.error(err);
    res.send(loginPageHtml("Gagal login, coba lagi."));
  }
});

app.get("/logout", (req, res) => {
  res.setHeader("Set-Cookie", clearSessionCookie());
  res.redirect("/login");
});

// satu akun sekarang login ke satu app, tinggal pilih mau ke dashboard yang mana
app.get("/dashboard", requireAuth, (req, res) => {
  res.send(`<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dashboard</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: system-ui, sans-serif; background: #0f172a; color: #e2e8f0; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
  .picker { display: flex; gap: 16px; }
  a.tile { background: #1e293b; border-radius: 12px; padding: 28px 36px; color: #e2e8f0; text-decoration: none; font-size: 16px; text-align: center; line-height: 1.6; }
  a.tile:hover { background: #334155; }
  a.logout { position: fixed; top: 20px; right: 20px; color: #94a3b8; font-size: 13px; text-decoration: none; }
  a.logout:hover { color: #e2e8f0; }
</style>
</head>
<body>
  <a class="logout" href="/logout">Log out</a>
  <div class="picker">
    <a class="tile" href="/dashboard/spending">💸<br>Spending</a>
    <a class="tile" href="/dashboard/calorie">🍽️<br>Calories</a>
  </div>
</body>
</html>`);
});

app.use(hubRouter);
app.use(spendingRouter);
app.use(calorieRouter);

app.listen(PORT, () => {
  console.log(`Webhook server jalan di port ${PORT}`);
  registerSpendingCommands().catch((err) =>
    console.error("Gagal set command menu Telegram (spending):", err)
  );
  registerCalorieCommands().catch((err) =>
    console.error("Gagal set command menu Telegram (calorie):", err)
  );
});
