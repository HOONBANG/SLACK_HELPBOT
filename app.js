const { App, ExpressReceiver } = require('@slack/bolt');
require('dotenv').config();

// ExpressReceiver 생성 (Slack의 요청을 받을 수 있도록 설정)
const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  endpoints: {
    events: '/slack/events',
    actions: '/slack/interactions', // 버튼 인터랙션 처리 경로
  },
});

// Bolt App 초기화
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: false,
  port: process.env.PORT || 10000,
});

// 앱이 멘션되었을 때 처음 보여줄 버튼들
app.event('app_mention', async ({ event, client }) => {
  try {
    await client.chat.postMessage({
      channel: event.channel,
      thread_ts: event.ts, // 🧵 스레드에 메시지 남기기
      text: '무엇을 도와드릴까요?',
      blocks: [
        {
          type: 'section',
          text: { type: 'plain_text', text: '무엇을 도와드릴까요?' },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'IT지원' },
              action_id: 'btn_it_support',
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: '라이선스 요청' },
              action_id: 'btn_license_request',
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: 'HR문의' },
              action_id: 'btn_hr',
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: '서류 발급 요청' },
              action_id: 'btn_docs',
            },
          ],
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: '오피스' },
              action_id: 'btn_office',
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: '복지 안내' },
              action_id: 'btn_welfare',
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: '기타 문의' },
              action_id: 'btn_etc',
            },
          ],
        },
      ],
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
    thread_ts: body.message.ts, // 🧵 스레드 유지
    text: '필요한 지원 항목을 선택해주세요.',
    blocks: [
      {
        type: 'section',
        text: { type: 'plain_text', text: '필요한 지원 항목을 선택해주세요.' },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: '장비 수리' },
            action_id: 'btn_repair',
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: '드라이브 이동 요청' },
            action_id: 'btn_drive',
          },
        ],
      },
    ],
  });
});

// 라이선스 요청 버튼 클릭 시
app.action('btn_license_request', async ({ body, ack, client }) => {
  await ack();
  await client.chat.postMessage({
    channel: body.channel.id,
    thread_ts: body.message.ts,
    text: '요청할 라이선스를 선택해주세요.',
    blocks: [
      {
        type: 'section',
        text: { type: 'plain_text', text: '요청할 라이선스를 선택해주세요.' },
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'ADOBE' },
            action_id: 'btn_adobe',
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: 'MS OFFICE' },
            action_id: 'btn_ms_office',
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: '산돌구름' },
            action_id: 'btn_sandoll',
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: '기타' },
            action_id: 'btn_other_license',
          },
        ],
      },
    ],
  });
});

// 앱 시작
(async () => {
  await app.start();
  console.log('⚡ SuperBot is running on port', process.env.PORT || 10000);
})();
