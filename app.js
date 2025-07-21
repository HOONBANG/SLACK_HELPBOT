const { App } = require('@slack/bolt');
require('dotenv').config();

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: false,
  appToken: process.env.SLACK_APP_TOKEN,
  port: process.env.PORT || 10000,
});

// 앱이 멘션되었을 때 처음 보여줄 버튼들
app.event('app_mention', async ({ event, client }) => {
  try {
    await client.chat.postMessage({
      channel: event.channel,
      text: '무엇을 도와드릴까요?',
      blocks: [
        {
          type: 'section',
          text: { type: 'plain_text', text: '무엇을 도와드릴까요?' }
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'IT지원' },
              action_id: 'btn_it_support'
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: '라이선스 요청' },
              action_id: 'btn_license_request'
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: 'HR문의' },
              action_id: 'btn_hr'
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: '서류 발급 요청' },
              action_id: 'btn_docs'
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: '오피스' },
              action_id: 'btn_office'
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: '복지 안내' },
              action_id: 'btn_welfare'
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: '기타 문의' },
              action_id: 'btn_etc'
            }
          ]
        }
      ]
    });
  } catch (error) {
    console.error('Error handling app_mention:', error);
  }
});

// IT지원 버튼 클릭 시
app.action('btn_it_support', async ({ body, ack, client }) => {
  await ack();
  await client.chat.postMessage({
    channel: body.channel.id,
    text: '필요한 지원 항목을 선택해주세요.',
    blocks: [
      {
        type: 'section',
        text: { type: 'plain_text', text: '필요한 지원 항목을 선택해주세요.' }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: '장비 수리' },
            action_id: 'btn_repair'
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: '드라이브 이동 요청' },
            action_id: 'btn_drive'
          }
        ]
      }
    ]
  });
});

// 라이선스 요청 버튼 클릭 시
app.action('btn_license_request', async ({ body, ack, client }) => {
  await ack();
  await client.chat.postMessage({
    channel: body.channel.id,
    text: '요청할 라이선스를 선택해주세요.',
    blocks: [
      {
        type: 'section',
        text: { type: 'plain_text', text: '요청할 라이선스를 선택해주세요.' }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'ADOBE' },
            action_id: 'btn_adobe'
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: 'MS OFFICE' },
            action_id: 'btn_ms_office'
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: '산돌구름' },
            action_id: 'btn_sandoll'
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: '기타' },
            action_id: 'btn_other_license'
          }
        ]
      }
    ]
  });
});

// 나머지 버튼들도 필요하면 이어서 추가 가능 (HR, 오피스 등)

(async () => {
  await app.start();
  console.log('⚡ SuperBot is running on port', process.env.PORT || 10000);
})();
