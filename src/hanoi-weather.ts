import { privateKeyToAccount } from "viem/accounts";
import { Mppx, tempo } from "mppx/client";

// --- Config from environment ---
const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN!;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID!;

if (!PRIVATE_KEY || !BOT_TOKEN || !CHAT_ID) {
  console.error(
    "Missing env vars: PRIVATE_KEY, TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID"
  );
  process.exit(1);
}

// --- Set up MPP payment handler ---
const account = privateKeyToAccount(PRIVATE_KEY);
const mppx = Mppx.create({
  polyfill: false,
  methods: [tempo({ account, maxDeposit: "0.5" })],
});

async function main() {
  // 1. Fetch Hanoi 5-day forecast
  console.log("Fetching Hanoi weather...");
  const weatherRes = await mppx.fetch(
    "https://weather.mpp.paywithlocus.com/openweather/forecast-5day",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lat: 21.0285,
        lon: 105.8542,
        units: "metric",
      }),
    }
  );
  const weather = await weatherRes.json();

  // 2. Summarize in Vietnamese using gpt-4o-mini (cheapest)
  console.log("Generating Vietnamese summary...");
  const prompt = `Dựa trên dữ liệu thời tiết dưới đây cho Hà Nội, hãy viết bản tin thời tiết ngắn gọn bằng tiếng Việt.
Bao gồm: nhiệt độ, tình trạng thời tiết, khả năng mưa, độ ẩm, gió.
Thêm dự báo vài ngày tới. Dùng emoji cho sinh động. Giữ ngắn gọn.

Dữ liệu:
${JSON.stringify(weather, null, 2).slice(0, 3000)}`;

  const aiRes = await mppx.fetch(
    "https://openai.mpp.tempo.xyz/v1/chat/completions",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 500,
      }),
    }
  );
  const aiData = await aiRes.json();
  const message = aiData.choices?.[0]?.message?.content;

  if (!message) {
    console.error("No message from AI:", JSON.stringify(aiData));
    process.exit(1);
  }

  // 3. Send to Telegram
  console.log("Sending to Telegram...");
  const tgRes = await globalThis.fetch(
    `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message,
        parse_mode: "Markdown",
      }),
    }
  );
  const tgData = await tgRes.json();

  if (!tgData.ok) {
    // Retry without Markdown if parse fails
    await globalThis.fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: CHAT_ID, text: message }),
      }
    );
  }

  console.log("Done: weather forecast sent to Telegram!");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
