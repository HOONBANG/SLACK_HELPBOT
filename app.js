const { App, ExpressReceiver } = require('@slack/bolt');
require('dotenv').config();

// --- ExpressReceiver 초기화 ---
const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  endpoints: {
    events: '/slack/events',
    actions: '/slack/interactions',
  },
});

// --- Slack App 초기화 ---
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: false,
});

// --- 설정값 ---
const channelId = 'C04NUTT5771'; // 공개 채널
const managerId = 'U08L6553LEL'; // 담당자
const adminId = 'U08L6553LEL'; // 2차 인증 담당자 (같은 담당자 사용)

// --- 메모리 기반 상태 저장 ---
let userState = {}; 
// { userId: { step, requestText, threadTs, lastActionId, lastActionText } }

// --- 버튼 제목 맵 ---
const actionIdToTitle = {
  btn_repair: ':computer:장비 수리',
  btn_drive: ':drive_icon:구글 드라이브',
  btn_ms_office: 'MS OFFICE',
  btn_adobe: 'ADOBE',
  btn_sandoll: '산돌구름',
  btn_other_license: '기타 라이선스',
  btn_attendance: ':clock10:근태 안내',
  btn_vacation: ':palm_tree:연차 안내',
  btn_docs: ':pencil:서류 발급 요청',
  btn_oa: ':toolbox:OA존 물품',
  btn_printer: ':printer:복합기 연결',
  btn_desk: ':busts_in_silhouette:구성원 자리 확인',
  btn_admin: '2차 인증번호 요청',
  btn_other_office: '기타 요청',
};

// --- 담당자 호출이 필요한 버튼 ---
const callManagerButtons = new Set([
  'btn_repair','btn_drive','btn_ms_office','btn_adobe','btn_sandoll','btn_other_license','btn_docs','btn_other_office'
]);

// --- 버튼 블록 정의 ---
const Blocks = () => ([ /* (원본 그대로 유지) */ 
  {
    type: 'section',
    text: { type: 'plain_text', text: '안녕하세요! 무엇을 도와드릴까요? :blush:' },
  },
  {
    type: 'section', text: { type: 'mrkdwn', text: '*IT지원 요청*' }
  },
  {
    type: 'actions',
    elements: [
      { type: 'button', text: { type: 'plain_text', text: ':computer:장비 수리' }, action_id: 'btn_repair' },
      { type: 'button', text: { type: 'plain_text', text: ':drive_icon:구글 드라이브' }, action_id: 'btn_drive' },
    ],
  },
  {
    type: 'section', text: { type: 'mrkdwn', text: '*라이선스 신청*' }
  },
  {
    type: 'actions',
    elements: [
      { type: 'button', text: { type: 'plain_text', text: 'MS OFFICE' }, action_id: 'btn_ms_office' },
      { type: 'button', text: { type: 'plain_text', text: 'ADOBE' }, action_id: 'btn_adobe' },
      { type: 'button', text: { type: 'plain_text', text: '산돌구름' }, action_id: 'btn_sandoll' },
      { type: 'button', text: { type: 'plain_text', text: '기타 라이선스' }, action_id: 'btn_other_license' },
    ],
  },
  {
    type: 'section', text: { type: 'mrkdwn', text: '*HR 관련 문의*' }
  },
  {
    type: 'actions',
    elements: [
      { type: 'button', text: { type: 'plain_text', text: ':clock10:근태 안내' }, action_id: 'btn_attendance' },
      { type: 'button', text: { type: 'plain_text', text: ':palm_tree:연차 안내' }, action_id: 'btn_vacation' },
      { type: 'button', text: { type: 'plain_text', text: ':pencil:서류 발급 요청' }, action_id: 'btn_docs' },
    ],
  },
  {
    type: 'section', text: { type: 'mrkdwn', text: '*오피스 관련 요청*' }
  },
  {
    type: 'actions',
    elements: [
      { type: 'button', text: { type: 'plain_text', text: ':toolbox:OA존 물품' }, action_id: 'btn_oa' },
      { type: 'button', text: { type: 'plain_text', text: ':printer:복합기 연결' }, action_id: 'btn_printer' },
      { type: 'button', text: { type: 'plain_text', text: ':busts_in_silhouette:구성원 자리 확인' }, action_id: 'btn_desk' },
      { type: 'button', text: { type: 'plain_text', text: '2차 인증번호 요청' }, action_id: 'btn_admin' },
      { type: 'button', text: { type: 'plain_text', text: '기타 요청' }, action_id: 'btn_other_office' },
    ],
  },
]);

// --- 버튼별 메시지 ---
const Messages = { /* (원본 그대로 유지) */ ... };

// --- DM 이벤트: 헬프봇 멘션 시 버튼 표시 ---
app.event('message', async ({ event, client }) => {
  try {
    if (event.channel_type === 'im' && !event.bot_id && !event.thread_ts) {
      const botUserId = (await client.auth.test()).user_id;
      if (event.text?.includes(`<@${botUserId}>`)) {
        await client.chat.postMessage({
          channel: event.channel,
          text: '무엇을 도와드릴까요? :blush:',
          blocks: Blocks(),
        });
        userState[event.user] = { step: 'none' };
      }
    }
  } catch (error) {
    console.error(error);
  }
});

// --- 1️⃣ 일반 버튼 클릭 처리 ---
app.action(/^(btn_(?!call_).*)$/, async ({ ack, body, client, action }) => {
  await ack();

  const userId = body.user.id;
  const channelIdDM = body.channel.id;
  const threadTs = body.message.ts;
  const actionId = action.action_id;
  const actionText = actionIdToTitle[actionId];
  const messageText = Messages[actionId];

  if (!messageText) return;

  // 안내 메시지 출력
  const result = await client.chat.postMessage({
    channel: channelIdDM,
    thread_ts: threadTs,
    text: messageText,
  });

  // 상태 저장
  userState[userId] = {
    step: 'waiting_input',
    requestText: '',
    threadTs: result.ts,
    lastActionId: actionId,
    lastActionText: actionText,
  };

  // 담당자 호출 버튼 생성
  if (callManagerButtons.has(actionId)) {
    await client.chat.postMessage({
      channel: channelIdDM,
      thread_ts: result.ts,
      text: '요청을 담당자에게 전달하시겠어요?',
      blocks: [
        {
          type: 'actions',
          elements: [
            { type: 'button', text: { type: 'plain_text', text: '담당자 호출' }, action_id: 'btn_call_manager' },
          ],
        },
      ],
    });
  } else if (actionId === 'btn_admin') {
    await client.chat.postMessage({
      channel: channelIdDM,
      thread_ts: result.ts,
      text: '2차 인증 요청을 담당자에게 전달하시겠어요?',
      blocks: [
        {
          type: 'actions',
          elements: [
            { type: 'button', text: { type: 'plain_text', text: '2차 인증 요청' }, action_id: 'btn_call_admin' },
          ],
        },
      ],
    });
  }
});

// --- 2️⃣ 담당자 호출 / 2차 인증 요청 버튼 처리 ---
app.action(/^(btn_call_.*)$/, async ({ ack, body, client, action }) => {
  await ack();

  const userId = body.user.id;
  const channelIdDM = body.channel.id;
  const threadTs = body.message.thread_ts || body.message.ts;
  const actionId = action.action_id;
  const state = userState[userId];
  if (!state) return;

  const { requestText = '', lastActionText: actionText = '' } = state;
  const quotedText = requestText
    ? requestText.split('\n').map(line => `> ${line}`).join('\n')
    : '';

  try {
    let postText = '';
    let threadMessage = '';
    let dmMessage = '';

    if (actionId === 'btn_call_manager') {
      postText = `<@${managerId}> 확인 부탁드립니다.`;
      threadMessage = `*[${actionText}]*\n*요청자:* <@${userId}>\n*내용:*\n${quotedText}`;
      dmMessage = '담당자에게 요청을 전달했습니다. 잠시만 기다려주세요.';
    } else if (actionId === 'btn_call_admin') {
      postText = `<@${adminId}> 2차 인증 요청이 도착했습니다.`;
      threadMessage = `*[${actionText}]*\n*요청자:* <@${userId}>\n*내용:*\n${quotedText}`;
      dmMessage = '담당자에게 2차 인증 요청을 전달했습니다. 잠시만 기다려주세요.';
    }

    // 공개 채널에 알림 전송
    const result = await client.chat.postMessage({
      channel: channelId,
      text: postText,
    });

    // 공개 채널 스레드에 요청 내용 남기기
    await client.chat.postMessage({
      channel: channelId,
      thread_ts: result.ts,
      text: threadMessage,
    });

    // DM 스레드에 요청자에게 안내 남기기
    await client.chat.postMessage({
      channel: channelIdDM,
      thread_ts: threadTs,
      text: dmMessage,
    });

    delete userState[userId];
  } catch (error) {
    console.error('🚨 요청 전달 중 오류 발생:', error);
  }
});

// --- 헬스체크 ---
receiver.app.get('/', (req, res) => res.send('Slack HelpBot is running ✅'));

// --- 서버 시작 ---
const PORT = process.env.PORT || 10000;
(async () => {
  await app.start(PORT);
  console.log('⚡ HelpBot is running on port', PORT);
})();
