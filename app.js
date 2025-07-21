require('dotenv').config();
const { App } = require('@slack/bolt');

// 초기화
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: false,
  appToken: process.env.SLACK_APP_TOKEN,
  port: process.env.PORT || 10000,
});

// 1단계 메시지 구성
function createFirstLevelMessage(ts) {
  return {
    thread_ts: ts,
    text: '도움이 필요하신가요?',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'plain_text',
          text: '도움이 필요하신가요?',
        },
      },
      {
        type: 'actions',
        elements: [
          createButton('IT지원', 0),
          createButton('라이선스 요청', 1),
          createButton('HR문의', 2),
        ],
      },
      {
        type: 'actions',
        elements: [
          createButton('서류 발급 요청', 3),
          createButton('오피스', 4),
          createButton('복지 안내', 5),
          createButton('기타 문의', 6),
        ],
      },
    ],
  };
}

// 버튼 생성 함수
function createButton(label, index) {
  return {
    type: 'button',
    text: {
      type: 'plain_text',
      text: label,
      emoji: true,
    },
    value: label,
    action_id: `first_level_${index}`,
  };
}

// 2단계 메시지 구성
function createSecondLevelMessage(value, ts) {
  let options = [];

  if (value === 'IT지원') {
    options = ['장비 수리', '드라이브 이동 요청'];
  } else if (value === '라이선스 요청') {
    options = ['ADOBE', 'MS OFFICE', '산돌구름', '기타'];
  }

  const displayText =
    value === 'IT지원'
      ? '요청하실 항목을 선택해주세요.'
      : '요청할 라이선스를 선택해주세요.';

  return {
    thread_ts: ts,
    text: displayText,
    blocks: [
      {
        type: 'section',
        text: {
          type: 'plain_text',
          text: displayText,
        },
      },
      {
        type: 'actions',
        elements: options.map((opt, index) => ({
          type: 'button',
          text: {
            type: 'plain_text',
            text: opt,
            emoji: true,
          },
          value: opt,
          action_id: `second_level_${index}`,
        })),
      },
    ],
  };
}

// @mention 감지 및 1단계 버튼 출력
app.event('app_mention', async ({ event, client }) => {
  try {
    await client.chat.postMessage({
      channel: event.channel,
      ...createFirstLevelMessage(event.ts),
    });
  } catch (error) {
    console.error('Error handling app_mention:', error);
  }
});

// 1단계 버튼 클릭 처리
app.action(/^first_level_\d+$/, async ({ body, ack, client, action }) => {
  await ack();

  const selected = action.value;
  const ts = body.message.ts;
  const channel = body.channel.id;

  if (selected === 'IT지원' || selected === '라이선스 요청') {
    await client.chat.postMessage({
      channel,
      ...createSecondLevelMessage(selected, ts),
    });
  } else {
    await client.chat.postMessage({
      channel,
      thread_ts: ts,
      text: `${selected} 요청을 접수하였습니다.`,
    });
  }
});

// 2단계 버튼 클릭 처리
app.action(/^second_level_\d+$/, async ({ body, ack, client, action }) => {
  await ack();

  const ts = body.message.ts;
  const channel = body.channel.id;

  await client.chat.postMessage({
    channel,
    thread_ts: ts,
    text: `${action.value} 요청이 접수되었습니다.`,
  });
});

// 앱 시작
(async () => {
  await app.start();
  console.log(`⚡ SuperBot is running on port ${process.env.PORT || 10000}`);
})();
