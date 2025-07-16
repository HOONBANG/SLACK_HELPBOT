const { App } = require('@slack/bolt');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: false,
  port: process.env.PORT || 3000,
});

// 사용자 멘션 시 버튼 포함 메시지 보내기
app.event('app_mention', async ({ event, say }) => {
  await say({
    text: '무엇을 도와드릴까요?',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '무엇을 도와드릴까요? 버튼을 눌러주세요!',
        },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: {
              type: 'plain_text',
              text: '오늘 날씨',
            },
            action_id: 'weather_today',
          },
        ],
      },
    ],
  });
});

// 버튼 클릭 처리
app.action('weather_today', async ({ ack, body, client }) => {
  await ack(); // 버튼 클릭 acknowledge

  // 버튼 누른 사용자에게 DM 보내기
  await client.chat.postMessage({
    channel: body.user.id,
    text: '오늘 날씨는 맑음입니다. ☀️',
  });
});

(async () => {
  await app.start();
  console.log('⚡ SuperBot is running!');
})();

