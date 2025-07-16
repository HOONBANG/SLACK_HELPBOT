const { App } = require('@slack/bolt');

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: false,
  appToken: process.env.SLACK_APP_TOKEN, // 필요 없으면 생략
  port: process.env.PORT || 3000,
});

app.event('app_mention', async ({ event, client }) => {
  await client.chat.postMessage({
    channel: event.channel,
    text: '아래 버튼을 눌러 오늘 날씨를 확인하세요!',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*오늘 날씨를 알려드릴까요?*',
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

app.action('weather_today', async ({ body, ack, client }) => {
  await ack();
  await client.chat.postMessage({
    channel: body.user.id, // 개인 DM
    text: '☀️ 오늘 날씨는 맑음입니다!',
  });
});

(async () => {
  await app.start();
  console.log('⚡ SuperBot is running!');
})();
