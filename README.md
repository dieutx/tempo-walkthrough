# Tempo Walkthrough

A practical walkthrough of using [Tempo](https://tempo.xyz) for paying APIs with USDC — via CLI and programmatically with your own EVM private key.

## Setup

### Install Tempo CLI

```bash
curl -fsSL https://tempo.xyz/install | bash
```

> **Note:** Tempo v1.4.3+ requires glibc 2.38+. On Ubuntu 22.04 (glibc 2.35), use a Docker wrapper — see [docker-wrapper.sh](docker-wrapper.sh).

### Login

```bash
tempo wallet login
```

Authenticates via browser/passkey. Verify with:

```bash
tempo wallet -t whoami
```

### Install Extensions

```bash
tempo add wallet
```

## Usage

### Service Discovery

```bash
# Search for services
tempo wallet -t services --search "parallel"

# Get service details & endpoints
tempo wallet -t services <SERVICE_ID>
```

### Making Requests

```bash
# GET request
tempo request -t -X GET <SERVICE_URL>/<ENDPOINT_PATH>

# POST request with JSON body
tempo request -t -X POST --json '{"key":"value"}' <SERVICE_URL>/<ENDPOINT_PATH>

# Preview cost without paying
tempo request --dry-run -t -X POST --json '...' <SERVICE_URL>/<ENDPOINT_PATH>
```

### Wallet Management

```bash
# Check balance
tempo wallet -t whoami

# List active payment sessions
tempo wallet -t sessions list

# Close a session to unlock funds
tempo wallet sessions close <CHANNEL_ID>

# Fund wallet
tempo wallet fund
```

## Examples

### 1. Web Search & Extraction (Parallel)

```bash
# Search the web
tempo request -t -X POST --json '{"query":"Stripe documentation"}' \
  https://parallelmpp.dev/api/search

# Extract page content
tempo request -t -X POST --json '{"urls":["https://stripe.com/docs"]}' \
  https://parallelmpp.dev/api/extract
```

### 2. AI Chat (Anthropic Claude Haiku — cheapest)

```bash
tempo request -t -X POST --json '{
  "model":"claude-haiku-4-5-20251001",
  "max_tokens":150,
  "messages":[{"role":"user","content":"Hello"}]
}' https://anthropic.mpp.tempo.xyz/v1/messages
```

### 3. AI Chat (OpenAI GPT-4o-mini — cheapest)

```bash
tempo request -t -X POST --json '{
  "model":"gpt-4o-mini",
  "messages":[{"role":"user","content":"Hello"}],
  "max_tokens":150
}' https://openai.mpp.tempo.xyz/v1/chat/completions
```

### 4. Weather (OpenWeather)

```bash
tempo request -t -X POST --json '{"lat":21.0285,"lon":105.8542,"units":"metric"}' \
  https://weather.mpp.paywithlocus.com/openweather/current-weather
```

### 5. Daily Hanoi Weather Forecast to Telegram

Two implementations available:

**Bash (uses Tempo CLI):** [hanoi-weather.sh](hanoi-weather.sh)

**Node.js (uses EVM private key + mppx):** [src/hanoi-weather.ts](src/hanoi-weather.ts)

```bash
# Bash version
bash hanoi-weather.sh

# Node.js version (bring your own EVM key)
npm install
PRIVATE_KEY=0x... TELEGRAM_BOT_TOKEN=... TELEGRAM_CHAT_ID=... npx tsx src/hanoi-weather.ts

# Schedule via crontab (6am UTC+7 = 23:00 UTC)
# 3 23 * * * cd /path/to/repo && npx tsx src/hanoi-weather.ts
```

## Using Your Own EVM Private Key (mppx SDK)

Instead of the Tempo CLI, you can use any EVM private key with the [`mppx`](https://www.npmjs.com/package/mppx) SDK. This handles `402 Payment Required` responses automatically.

### Setup

```bash
npm install mppx viem
```

### Quick start

```ts
import { privateKeyToAccount } from "viem/accounts";
import { Mppx, tempo } from "mppx/client";

const account = privateKeyToAccount("0xYOUR_PRIVATE_KEY");
const mppx = Mppx.create({
  polyfill: false,
  methods: [tempo({ account, maxDeposit: "0.5" })],
});

// Payment happens automatically on 402 responses
const res = await mppx.fetch("https://openai.mpp.tempo.xyz/v1/chat/completions", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: "Hello" }],
    max_tokens: 100,
  }),
});
const data = await res.json();
```

### How it works

1. `mppx.fetch()` sends your request to an MPP-enabled API
2. Server returns `402` with a payment challenge
3. SDK signs a Tempo transaction with your private key
4. Retries with `Authorization: Payment` credential
5. Server verifies, returns response + receipt

### Key details

| | |
|---|---|
| **Network** | Tempo (Chain ID `4217`, RPC `https://rpc.tempo.xyz`) |
| **Currency** | USDC on Tempo |
| **Funding** | Bridge USDC via Across, LayerZero, Relay, or use `tempo wallet transfer` |
| **maxDeposit** | Amount locked per payment channel (unused funds refunded on close) |
| **Sessions** | For metered APIs (LLMs), channels amortize on-chain costs across many requests |

## Available Services (55+)

Browse all at `https://mpp.dev/services/llms.txt` or:

```bash
tempo wallet -t services --search "<query>"
```

| Category | Services |
|----------|----------|
| **AI** | Anthropic, OpenAI, OpenRouter, Gemini, fal.ai, Replicate, Perplexity, Stability AI |
| **Search** | Parallel, Exa, SerpApi, SpyFu |
| **Web** | Firecrawl, Browserbase, Oxylabs, Browser Use |
| **Data** | Allium, Dune, Codex, Alchemy, EDGAR, OpenWeather, Google Maps |
| **Media** | StableStudio, Suno |
| **Storage** | Object Storage, StableUpload, Code Storage |
| **Social** | AgentMail, StableEmail, StablePhone, StableSocial |
| **Travel** | StableTravel, FlightAPI, AviationStack |

## Pricing

- All payments in USDC on Tempo network
- Session-based (AI models) or per-request pricing
- Typical costs: $0.001–$0.01 per request
- Use `--dry-run` to preview costs

## Tips

- Always use full paths: `"$HOME/.local/bin/tempo"` or `"$HOME/.tempo/bin/tempo"`
- Use `--dry-run` before expensive requests
- Close idle sessions to unlock funds: `tempo wallet sessions close <ID>`
- Check endpoint docs with `tempo wallet -t services <SERVICE_ID>` when getting 422 errors
