const { App, ExpressReceiver } = require('@slack/bolt');
require('dotenv').config();

// ExpressReceiver: 슬랙 인터랙션 수신용
const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  endpoints: {
    events: '/slack/events',
    actions: '/slack/interactions',
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

// 슬랙 앱 멘션 시 버튼 블록 전체 노출
app.event('app_mention', async ({ event, client }) => {
  try {
    await client.chat.postMessage({
      channel: event.channel,
      thread_ts: event.ts, // 스레드에 답변
      text: '무엇을 도와드릴까요?',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'plain_text',
            text: '무엇을 도와드릴까요?',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*IT지원이 필요해요.*',
          },
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
          text: {
            type: 'mrkdwn',
            text: '*라이선스를 요청하고 싶어요.*',
          },
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
          text: {
            type: 'mrkdwn',
            text: '*HR 관련 문의*',
          },
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
          text: {
            type: 'mrkdwn',
            text: '*오피스 관련 요청*',
          },
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
              action_id: 'btn_desk',
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: '기타 요청' },
              action_id: 'btn_other_office',
            },
          ],
        },
      ],
    });
  } catch (error) {
    console.error('Error handling app_mention:', error);
  }
});

// 버튼 액션 처리 (기본 ack)
app.action(/btn_.*/, async ({ ack }) => {
  await ack();
});

// Render 배포 확인용 라우트
receiver.router.get('/', (req, res) => {
  res.send('Slack SuperBot is running ✅');
});

// 앱 실행
(async () => {
  const port = process.env.PORT || 10000;
  await app.start(port);
  console.log('⚡ SuperBot is running on port', port);
})();
