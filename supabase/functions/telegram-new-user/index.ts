import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type SignupPayload = {
  type?: unknown;
  schema?: unknown;
  table?: unknown;
  record?: {
    id?: unknown;
    email?: unknown;
    created_at?: unknown;
    user_metadata?: Record<string, unknown> | null;
  };
};

const encoder = new TextEncoder();

function hasMatchingSecret(request: Request, expected: string): boolean {
  const provided = request.headers.get("authorization") ?? "";
  const expectedValue = `Bearer ${expected}`;
  const left = encoder.encode(provided);
  const right = encoder.encode(expectedValue);
  if (left.length !== right.length) return false;

  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function textValue(value: unknown, maxLength = 200): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

serve(async (request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const webhookSecret = Deno.env.get("PROFI_SIGNUP_WEBHOOK_SECRET");
  const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const chatId = Deno.env.get("TELEGRAM_CHAT_ID");

  if (!webhookSecret || !botToken || !chatId) {
    return new Response("Notification service is not configured", { status: 503 });
  }

  if (!hasMatchingSecret(request, webhookSecret)) {
    return new Response("Unauthorized", { status: 401 });
  }

  let payload: SignupPayload;
  try {
    payload = await request.json();
  } catch {
    return new Response("Invalid JSON", { status: 400 });
  }

  if (
    payload.type !== "INSERT" ||
    payload.schema !== "auth" ||
    payload.table !== "users" ||
    !payload.record ||
    typeof payload.record.id !== "string"
  ) {
    return new Response("Invalid signup event", { status: 400 });
  }

  const metadata = payload.record.user_metadata ?? {};
  const firstName = textValue(metadata.first_name ?? metadata.given_name, 80);
  const lastName = textValue(metadata.last_name ?? metadata.family_name, 80);
  const fullName =
    textValue(metadata.full_name ?? metadata.name, 160) ||
    [lastName, firstName].filter(Boolean).join(" ") ||
    "Не указано";
  const email = textValue(payload.record.email, 254) || "Не указан";
  const createdAt = textValue(payload.record.created_at, 40);
  const date = createdAt && !Number.isNaN(Date.parse(createdAt))
    ? new Date(createdAt).toLocaleString("ru-RU", { timeZone: "Asia/Tashkent" })
    : "Не указано";

  const message = [
    "🆕 <b>Новый пользователь Profi.UZ</b>",
    `Имя: ${escapeHtml(fullName)}`,
    `Email: ${escapeHtml(email)}`,
    `Дата: ${escapeHtml(date)}`,
  ].join("\n");

  const telegramResponse = await fetch(
    `https://api.telegram.org/bot${botToken}/sendMessage`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "HTML",
        disable_web_page_preview: true,
      }),
    },
  );

  if (!telegramResponse.ok) {
    // Avoid logging Telegram's response body because it may contain sensitive details.
    return new Response("Telegram delivery failed", { status: 502 });
  }

  return new Response("Notification sent", { status: 200 });
});
