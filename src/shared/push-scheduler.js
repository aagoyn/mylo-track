import { getSubscribedPhones, sendPushToPhone } from "./push.js";
import {
  dayOfWeekWib,
  getTodayClockLog,
  markClockoutReminderSent,
  CLOCK_OUT_AFTER_MS,
} from "../hub/clocked/supabase.js";

const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
const CLOCK_IN_REMINDER_HOUR = 9;
const CLOCK_IN_REMINDER_DAYS = [1, 2, 4]; // Senin, Selasa, Kamis - sama kayak hari default WFO

let clockInReminderSentDateKey = null;

function wibNow() {
  return new Date(Date.now() + WIB_OFFSET_MS);
}

async function checkClockInReminder() {
  const wib = wibNow();
  const dateKey = wib.toISOString().slice(0, 10);
  if (wib.getUTCHours() !== CLOCK_IN_REMINDER_HOUR || wib.getUTCMinutes() !== 0) return;
  if (!CLOCK_IN_REMINDER_DAYS.includes(dayOfWeekWib())) return;
  if (clockInReminderSentDateKey === dateKey) return;
  clockInReminderSentDateKey = dateKey;

  const phones = await getSubscribedPhones();
  for (const phone of phones) {
    const log = await getTodayClockLog(phone);
    if (log) continue;
    await sendPushToPhone(phone, {
      title: "Yuk Clock In 👋",
      body: "Jangan lupa Clock In hari ini.",
      url: "/hub/clocked",
    });
  }
}

async function checkClockOutReminder() {
  const phones = await getSubscribedPhones();
  for (const phone of phones) {
    const log = await getTodayClockLog(phone);
    if (!log || log.work_mode !== "WFO" || !log.clock_in_at || log.clock_out_at) continue;
    if (log.clockout_reminder_sent_at) continue;

    const elapsedMs = Date.now() - new Date(log.clock_in_at).getTime();
    if (elapsedMs < CLOCK_OUT_AFTER_MS) continue;

    await sendPushToPhone(phone, {
      title: "Udah 9 jam! 🎉",
      body: "Saatnya Clock Out.",
      url: "/hub/clocked",
    });
    await markClockoutReminderSent(log.id);
  }
}

export function startPushScheduler() {
  const tick = () => {
    checkClockInReminder().catch((err) => console.error("checkClockInReminder gagal:", err));
    checkClockOutReminder().catch((err) => console.error("checkClockOutReminder gagal:", err));
  };
  tick();
  setInterval(tick, 60 * 1000);
}
