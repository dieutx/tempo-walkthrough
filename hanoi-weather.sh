#!/usr/bin/env bash
set -e

TEMPO="$HOME/.local/bin/tempo"
BOT_TOKEN="${TELEGRAM_BOT_TOKEN}"
CHAT_ID="${TELEGRAM_CHAT_ID}"

# 1. Fetch Hanoi 5-day forecast
WEATHER=$("$TEMPO" request -t -X POST --json '{"lat":21.0285,"lon":105.8542,"units":"metric"}' https://weather.mpp.paywithlocus.com/openweather/forecast-5day 2>&1)

# 2. Summarize in Vietnamese using gpt-4o-mini (cheapest)
PROMPT="Dựa trên dữ liệu thời tiết dưới đây cho Hà Nội, hãy viết bản tin thời tiết ngắn gọn bằng tiếng Việt. Bao gồm: nhiệt độ, tình trạng thời tiết, khả năng mưa, độ ẩm, gió. Thêm dự báo vài ngày tới. Dùng emoji cho sinh động. Giữ ngắn gọn.

Dữ liệu:
$WEATHER"

SUMMARY=$("$TEMPO" request -t -X POST --json "$(python3 -c "
import json, sys
prompt = sys.stdin.read()
print(json.dumps({
    'model': 'gpt-4o-mini',
    'messages': [{'role': 'user', 'content': prompt}],
    'max_tokens': 500
}))
" <<< "$PROMPT")" https://openai.mpp.tempo.xyz/v1/chat/completions 2>&1)

# 3. Extract the message content
MESSAGE=$(echo "$SUMMARY" | python3 -c "
import sys, re
text = sys.stdin.read()
# Find content field in toon output
match = re.search(r'content:\s*\"(.+?)\"(?:\s*\$|\s*\n)', text, re.DOTALL)
if match:
    print(match.group(1).replace('\\\\\\\\n', '\n').replace('\\\\n', '\n'))
else:
    # Try to find text between content markers
    lines = text.split('\n')
    capture = False
    result = []
    for line in lines:
        if 'content' in line and ('assistant' in text[:text.index(line)] if line in text else False):
            capture = True
            m = re.search(r'content[,:]?\s*\"?(.+?)\"?\s*\$', line)
            if m and m.group(1).strip():
                result.append(m.group(1))
        elif capture and line.strip() and not any(k in line for k in ['role:', 'refusal:', 'finish_reason:', 'usage:', 'prompt_tokens:']):
            result.append(line)
        elif capture and any(k in line for k in ['finish_reason:', 'usage:']):
            break
    print('\n'.join(result) if result else text[-1000:])
")

# 4. Send to Telegram
curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
  -d chat_id="$CHAT_ID" \
  -d parse_mode="Markdown" \
  --data-urlencode "text=${MESSAGE}" > /dev/null

echo "Done: message sent to Telegram"
