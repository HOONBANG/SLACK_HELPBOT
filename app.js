const { App } = require('@slack/bolt');

// 환경 변수에서 토큰과 시크릿 불러오기
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

// 슬래시 명령어 (/superbot) 처리
app.command('/superbot', async ({ ack, body, client }) => {
  await ack();

  try {
    await client.chat.postMessage({
      channel: body.channel_id,
      text: '원하는 기능을 선택하세요!',
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*무엇을 도와드릴까요?*"
          }
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "오늘 날씨"
              },
              value: "weather_today",
              action_id: "button_weather"
            },
            {
              type: "button",
              text: {
                type: "plain_text",
                text: "도움말"
              },
              value: "help",
              action_id: "button_help"
            }
          ]
        }
      ]
    });
  } catch (error) {
    console.error(error);
  }
});

// 버튼 클릭 이벤트 처리
app.action('button_weather', async ({ ack, body, client }) => {
  await ack();
  await client.chat.postMessage({
    channel: body.user.id,
    text: "오늘 날씨는 맑음입니다 ☀️"
  });
});

app.action('button_help', async ({ ack, body, client }) => {
  await ack();
  await client.chat.postMessage({
    channel: body.user.id,
    text: "/superbot을 입력해서 다양한 기능을 사용해보세요!"
  });
});

// 서버 시작
(async () => {
  await app.start(process.env.PORT || 3000);
  console.log('⚡ SuperBot is running!');
})();
