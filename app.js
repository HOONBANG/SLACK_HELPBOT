const { App } = require('@slack/bolt');

// 환경변수로부터 토큰 불러오기
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

// 슬래시 커맨드: /superbot
app.command('/superbot', async ({ ack, body, client }) => {
  await ack();

  await client.chat.postMessage({
    channel: body.channel_id,
    text: '무엇을 도와드릴까요?',
    blocks: [
      {
        "type": "actions",
        "elements": [
          {
            "type": "button",
            "text": {
              "type": "plain_text",
              "text": "오늘 날씨"
            },
            "action_id": "weather_button"
          }
        ]
      }
    ]
  });
});

// 버튼 클릭 시: "오늘 날씨는 맑음입니다" DM 전송
app.action('weather_button', async ({ ack, body, client }) => {
  await ack();

  const userId = body.user.id;

  // DM 채널 열기
  const dm = await client.conversations.open({ users: userId });

  // 메시지 전송
  await client.chat.postMessage({
    channel: dm.channel.id,
    text: "오늘 날씨는 맑음입니다."
  });
});

// 앱 실행
(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡ SuperBot is running!');
})();
