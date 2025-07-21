const { App, ExpressReceiver } = require('@slack/bolt');
require('dotenv').config();

// ExpressReceiver 생성: 커스텀 엔드포인트를 위한 설정
const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  endpoints: {
    events: '/slack/events',
    actions: '/slack/interactions', // 버튼 클릭 처리 경로
  },
});

// Bolt App 초기화
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: false,
});

// 멘션 이벤트: 첫 질문 + 버튼 UI
app.event('app_mention', async ({ event, client }) => {
  try {
    await client.chat.postMessage({
      channel: event.channel,
      thread_ts: event.ts, // 스레드에 메시지 남기기
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

// 버튼: IT지원 클릭
app.action('btn_it_support', async ({ body, ack, client }) => {
  await ack();
  await client.chat.postMessage({
    channel: body.channel.id,
    thread_ts: body.message.ts,
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

// 버튼: 라이선스 요청 클릭
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

// 필요한 만큼 버튼 핸들러를 계속 추가 가능

// 서버 시작
(async () => {
  const port = process.env.PORT || 10000;
  await app.start(port);
  console.log(`⚡ SuperBot is running on port ${port}`);
})();
