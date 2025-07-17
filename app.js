const { App } = require('@slack/bolt');

// 환경변수에서 인증 정보 로드
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: false,
  appToken: process.env.SLACK_APP_TOKEN
});

// 멘션 이벤트 처리
app.event('app_mention', async ({ event, say }) => {
  console.log('✅ SuperBot 멘션됨:', event);

  await say({
    thread_ts: event.ts, // 스레드에 메시지 전송
    text: '무엇을 도와드릴까요?',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: '*무엇을 도와드릴까요?* 아래 옵션 중 하나를 선택해 주세요.'
        }
      },
      {
        type: 'actions',
        elements: [
          {
            type: 'button',
            text: { type: 'plain_text', text: 'IT지원' },
            value: 'it_support',
            action_id: 'it_support'
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: '라이선스 요청' },
            value: 'license_request',
            action_id: 'license_request'
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: 'HR 문의' },
            value: 'hr_inquiry',
            action_id: 'hr_inquiry'
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: '복지 안내' },
            value: 'welfare_info',
            action_id: 'welfare_info'
          },
          {
            type: 'button',
            text: { type: 'plain_text', text: '서류 발급 요청' },
            value: 'document_request',
            action_id: 'document_request'
          }
        ]
      }
    ]
  });
});

// 버튼 클릭 시 응답 처리
app.action(/.*/, async ({ body, ack, say }) => {
  await ack();

  const user = `<@${body.user.id}>`;
  const action = body.actions[0].action_id;

  const replies = {
    it_support: 'IT 지원팀에 요청을 전달하겠습니다.',
    license_request: '필요한 라이선스 정보를 알려주세요.',
    hr_inquiry: 'HR 관련 문의사항을 말씀해주세요.',
    welfare_info: '복지 제도에 대한 안내를 도와드리겠습니다.',
    document_request: '필요한 서류 종류와 용도를 알려주세요.'
  };

  const replyText = replies[action] || '요청을 인식할 수 없습니다.';

  await say({
    thread_ts: body.message.ts,
    text: `${user}님, ${replyText}`
  });

  console.log(`✅ 버튼 클릭됨: ${action} by ${user}`);
});

// 서버 실행
(async () => {
  const port = process.env.PORT || 3000;
  await app.start(port);
  console.log(`⚡ SuperBot is running on port ${port}`);
})();
