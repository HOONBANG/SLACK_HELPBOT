const { App, ExpressReceiver } = require('@slack/bolt');
require('dotenv').config();

// ExpressReceiver 설정
const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  endpoints: {
    events: '/slack/events',
    actions: '/slack/interactions',
  },
});

// Bolt 앱 초기화
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: false,
  port: process.env.PORT || 10000,
});

// 앱이 멘션되었을 때 버튼 UI 노출
app.event('app_mention', async ({ event, client }) => {
  try {
    await client.chat.postMessage({
      channel: event.channel,
      thread_ts: event.ts,
      text: '무엇을 도와드릴까요?',
      blocks: [
        {
          type: 'section',
          text: { type: 'plain_text', text: '무엇을 도와드릴까요?' },
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: '*IT지원이 필요해요.*' },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: '업무 장비 수리' },
              action_id: 'btn_repair',
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: '드라이브 이동 요청' },
              action_id: 'btn_drive',
            },
          ],
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: '*라이선스를 요청하고 싶어요.*' },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'MS OFFICE' },
              action_id: 'btn_ms_office',
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: 'ADOBE' },
              action_id: 'btn_adobe',
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: '산돌구름' },
              action_id: 'btn_sandoll',
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: '기타 라이선스' },
              action_id: 'btn_other_license',
            },
          ],
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: '*HR 관련 문의*' },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: '근태 문의' },
              action_id: 'btn_attendance',
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: '연차 문의' },
              action_id: 'btn_vacation',
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: '서류 발급 요청' },
              action_id: 'btn_docs',
            },
          ],
        },
        {
          type: 'section',
          text: { type: 'mrkdwn', text: '*오피스 관련 요청*' },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: 'OA존 물품' },
              action_id: 'btn_oa',
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: '복합기 연결' },
              action_id: 'btn_printer',
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: '구성원 자리 확인' },
              action_id: 'btn_seat',
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: '기타 요청' },
              action_id: 'btn_office_other',
            },
          ],
        },
      ],
    });
  } catch (error) {
    console.error('Error handling app_mention:', error);
  }
});

// 모든 버튼 액션에 대해 ack 처리만 우선 적용 (기능은 이후 구현 가능)
const allActionIds = [
  'btn_repair',
  'btn_drive',
  'btn_ms_office',
  'btn_adobe',
  'btn_sandoll',
  'btn_other_license',
  'btn_attendance',
  'btn_vacation',
  'btn_docs',
  'btn_oa',
  'btn_printer',
  'btn_seat',
  'btn_office_other',
];

for (const actionId of allActionIds) {
  app.action(actionId, async ({ ack }) => {
    await ack();
    // 나중에 각 버튼별 동작 추가 가능
  });
}

// 앱 실행
(async () => {
  await app.start();
  console.log('⚡ SuperBot is running on port', process.env.PORT || 10000);
})();
