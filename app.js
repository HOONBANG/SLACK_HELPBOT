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
            text: '안녕하세요! 무엇을 도와드릴까요? :blush:',
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*IT지원 요청*',
          },
        },
        {
          type: 'actions',
          elements: [
            {
              type: 'button',
              text: { type: 'plain_text', text: ':computer:장비 수리' },
              action_id: 'btn_repair',
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: ':drive_icon:드라이브 이동 요청' },
              action_id: 'btn_drive',
            },
          ],
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: '*라이선스 신청*',
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
              text: { type: 'plain_text', text: ':clock10:근태 문의' },
              action_id: 'btn_attendance',
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: ':palm_tree:연차 문의' },
              action_id: 'btn_vacation',
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: ':pencil:서류 발급 요청' },
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
              text: { type: 'plain_text', text: ':toolbox:OA존 물품' },
              action_id: 'btn_oa',
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: ':printer:복합기 연결' },
              action_id: 'btn_printer',
            },
            {
              type: 'button',
              text: { type: 'plain_text', text: ':busts_in_silhouette:구성원 자리 확인' },
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

// "장비 수리" 버튼 처리
app.action('btn_repair', async ({ ack, body, client }) => {
  await ack(); // 여기서 1번만 호출

  await client.chat.postMessage({
    channel: body.channel.id,
    thread_ts: body.message.ts,
    text: `[:computer:장비 수리] \n언제부터 어떤 증상이 있었는지 자세히 말씀해주세요. (cc. @Hoon)\n시점: \n증상: `,
  });
});

// 나머지 버튼 처리 (btn_repair 제외)
app.action(/btn_.*/, async ({ ack, action }) => {
  if (action.action_id === 'btn_repair') return;
  await ack();
});

// Render 배포 확인용 라우트
receiver.router.get('/', (req, res) => {
  res.send('Slack HelpBot is running ✅');
});

// 앱 실행
(async () => {
  const port = process.env.PORT || 10000;
  await app.start(port);
  console.log('⚡ HelpBot is running on port', port);
})();
