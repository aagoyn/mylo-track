import "dotenv/config";
import express from "express";
import { createSessionCookie, clearSessionCookie, loginPageHtml } from "./shared/auth.js";
import { verifyLogin } from "./shared/users.js";
import { router as spendingRouter, registerCommands as registerSpendingCommands } from "./spending/router.js";
import { router as calorieRouter, registerCommands as registerCalorieCommands } from "./calorie/router.js";
import { router as hubRouter } from "./hub/router.js";
import { router as moodRouter } from "./hub/mood/router.js";
import { router as journalRouter } from "./hub/journal/router.js";
import { router as wishlistRouter } from "./hub/wishlist/router.js";
import { router as vaultRouter } from "./hub/vault/router.js";
import { router as skincareRouter } from "./hub/skincare/router.js";
import { router as clockedRouter } from "./hub/clocked/router.js";
import { router as grindRouter } from "./hub/grind/router.js";
import { router as pushRouter } from "./shared/push-router.js";
import { startPushScheduler } from "./shared/push-scheduler.js";

const PORT = process.env.PORT || 3000;

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));

app.get("/", (req, res) => res.send("ok"));

// Keep-alive ping (mis. cron-job.org) buat Render free tier biar server nggak sleep. Sengaja
// nggak query Supabase sama sekali dan ditaruh sebelum semua route lain - cukup balikin 200 OK
// instan tanpa auth/DB, biar ping-nya ringan dan nggak ikut bikin Supabase kebebanan.
app.get("/health", (req, res) => res.status(200).send("ok"));

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

app.use(hubRouter);
app.use(moodRouter);
app.use(journalRouter);
app.use(wishlistRouter);
app.use(vaultRouter);
app.use(skincareRouter);
app.use(clockedRouter);
app.use(grindRouter);
app.use(pushRouter);
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
  startPushScheduler();
});
