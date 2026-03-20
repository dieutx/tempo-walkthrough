import { privateKeyToAccount } from "viem/accounts";
import { Mppx, tempo } from "mppx/client";

const PRIVATE_KEY = process.env.PRIVATE_KEY as `0x${string}`;

if (!PRIVATE_KEY) {
  console.error("Missing env var: PRIVATE_KEY");
  process.exit(1);
}

const account = privateKeyToAccount(PRIVATE_KEY);
const mppx = Mppx.create({
  polyfill: false,
  methods: [tempo({ account, maxDeposit: "0.5" })],
});

async function main() {
  console.log("Wallet address:", account.address);

  // Test: call GPT-4o-mini via Tempo MPP
  console.log("\nCalling gpt-4o-mini via MPP...");
  const res = await mppx.fetch(
    "https://openai.mpp.tempo.xyz/v1/chat/completions",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "user", content: "Say hello in Vietnamese, one sentence." },
        ],
        max_tokens: 50,
      }),
    }
  );

  const text = await res.text();
  console.log("Raw response:", text.slice(0, 500));
  const data = JSON.parse(text);
  console.log("Response:", data.choices?.[0]?.message?.content);
  console.log("Usage:", data.usage);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
