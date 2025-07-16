const { App } = require('@slack/bolt');

// 환경 변수에서 가져오기
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

// @superbot 멘션 시 버튼 메시지 전송
app.event('app_mention', async ({ event, client }) => {
  try {
    await client.chat.postMessage({
      channel: event.channel,
      text: '무엇을 도와드릴까요?',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '안녕하세요! 무엇을 도와드릴까요? 아래에서 선택해 주세요.'
          }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: {
                type: 'plain_text',
                text: '오늘 날씨'
              },
              action_id: 'weather_button'
            }
          ]
        }
      ]
    });
  } catch (error) {
    console.error(error);
  }
});

// 버튼 클릭 처리
app.action('weather_button', async ({ ack, body, client }) => {
  await ack();
  await client.chat.postMessage({
    channel: body.user.id,
    text: '오늘 날씨는 맑음입니다. ☀️'
  });
});

(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡ SuperBot is running!');
})();
