import "dotenv/config";
import express from "express";
import { createSessionCookie, clearSessionCookie, loginPageHtml } from "./shared/auth.js";
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
