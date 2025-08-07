const { App, ExpressReceiver } = require('@slack/bolt');
require('dotenv').config();

const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  endpoints: {
    events: '/slack/events',
    actions: '/slack/interactions',
  },
});

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: false,
  port: process.env.PORT || 10000,
});

// DM 여부 체크 함수
const isDM = (channelId) => channelId.startsWith('D');

// --- 오피스 채널용 버튼 블록 ---
const getBlocksOffice = () => ([
  {
    type: 'section',
    text: {
      type: 'plain_text',
      text: '안녕하세요! 무엇을 도와드릴까요? :blush:',
    },
  },
  {
    type: 'section',
    text: { type: 'mrkdwn', text: '*IT지원 요청*' },
  },
  {
    type: 'actions',
    elements: [
      { type: 'button', text: { type: 'plain_text', text: ':computer:장비 수리' }, action_id: 'btn_repair' },
      { type: 'button', text: { type: 'plain_text', text: ':drive_icon:드라이브 이동 요청' }, action_id: 'btn_drive' },
    ],
  },
  {
    type: 'section',
    text: { type: 'mrkdwn', text: '*라이선스 신청*' },
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
    type: 'section',
    text: { type: 'mrkdwn', text: '*HR 관련 문의*' },
  },
  {
    type: 'actions',
    elements: [
      { type: 'button', text: { type: 'plain_text', text: ':clock10:근태 문의' }, action_id: 'btn_attendance_office' },
      { type: 'button', text: { type: 'plain_text', text: ':palm_tree:연차 문의' }, action_id: 'btn_vacation_office' },
      { type: 'button', text: { type: 'plain_text', text: ':pencil:서류 발급 요청' }, action_id: 'btn_docs' },
    ],
  },
  {
    type: 'section',
    text: { type: 'mrkdwn', text: '*오피스 관련 요청*' },
  },
  {
    type: 'actions',
    elements: [
      { type: 'button', text: { type: 'plain_text', text: '기타 요청' }, action_id: 'btn_other_office' },
    ],
  },
]);

// --- DM용 버튼 블록 ---
const getBlocksDM = () => ([
  {
    type: 'section',
    text: {
      type: 'plain_text',
      text: '안녕하세요! 무엇을 도와드릴까요? :blush:',
    },
  },
  {
    type: 'actions',
    elements: [
      { type: 'button', text: { type: 'plain_text', text: ':computer:장비 수리' }, action_id: 'btn_repair_dm' },
      { type: 'button', text: { type: 'plain_text', text: ':clock10:근태 문의' }, action_id: 'btn_attendance_dm' },
      { type: 'button', text: { type: 'plain_text', text: ':palm_tree:연차 문의' }, action_id: 'btn_vacation_dm' },
      { type: 'button', text: { type: 'plain_text', text: ':toolbox:OA존 물품' }, action_id: 'btn_oa' },
      { type: 'button', text: { type: 'plain_text', text: ':printer:복합기 연결' }, action_id: 'btn_printer' },
      { type: 'button', text: { type: 'plain_text', text: ':busts_in_silhouette:구성원 자리 확인' }, action_id: 'btn_desk' },
    ],
  },
]);

// --- 오피스 채널용 버튼 액션 메시지 ---
const officeMessages = {
  btn_repair: '*[:computer:장비 수리]* \n언제부터 어떤 증상이 있었는지 자세히 말씀해주세요. (cc. <@U08L6553LEL>) \n• 시점: \n• 증상:',
  btn_drive: '*[:drive_icon:구글 드라이브]* \n어떤 도움이 필요하신가요? (cc. <@U08L6553LEL>) \n• 내용: 드라이브 이동 / 권한 설정 \n• 사유:',
  btn_ms_office: '*[MS OFFICE]* \n업무 상 MS OFFICE가 필요하신 경우가 있는지 말씀 부탁드립니다. (cc. <@U08L6553LEL>) \n\n※ 구글 워크스페이스 내 스프레드시트를 활용하고 있어 MS office를 전사 단위로 구매하고 있지 않습니다.',
  btn_adobe: '*[ADOBE]* \n어떤 프로그램이 필요하신가요? (cc. <@U08L6553LEL>) \n\n• Photoshop \n• Premiere Pro \n• Illustrator \n• 기타',
  btn_sandoll: '*[산돌구름]* \n회사 구글 계정으로 산돌구름 회원가입(개인) 후 말씀 부탁드립니다. :blush: \n (cc. <@U08L6553LEL>)',
  btn_other_license: '*[기타 라이선스]* \n필요하신 라이선스 제품과 요청 사유를 말씀 부탁드립니다. :blush: \n (cc. <@U08L6553LEL>)',
  btn_attendance_office: '*근태 문의* \n근태 관련 내용은 여기서 확인하세요!',
  btn_vacation_office: '*연차 문의* \n연차 관련 내용은 여기서 확인하세요!',
  btn_docs: '*[:pencil:서류 발급 요청]* \n어떤 서류 발급이 필요하신가요? :blush: \n (cc. <!subteam^S07DF7YSKB4>)',
  btn_other_office: '*[기타 요청]* \n어떤 도움이 필요하신가요? :blush: \n (cc. <@U08L6553LEL>)',
};

// --- DM용 버튼 액션 메시지 ---
const dmMessages = {
  btn_repair_dm: '*[:computer:장비 수리]* \n언제부터 어떤 증상이 있었는지 자세히 말씀해주세요. :blush:',
  btn_attendance_dm: '*근태 문의* \n근태 관련 내용은 여기서 확인하세요!',
  btn_vacation_dm: '*연차 문의* \n연차 관련 내용은 여기서 확인하세요!',
  btn_oa: '*[:toolbox:OA존 물품]* \nOA존 물품 관련 어떤 도움이 필요하신가요? :blush: \n (cc. <@U08L6553LEL>)',
  btn_printer: '*[:printer:복합기 연결]* \n복합기 연결 및 사용에 어려움이 있으신 경우,\n아래 두 가지 방법을 통해 지원을 받으실 수 있습니다. :blush:\n\n1. 복합기 상단 QR코드 통해 A/S 요청\n2. 복합기 업체 연락 - 제이에이솔루션 1566-3505\n※ 바이트랩 직원이라고 말씀하시면, 원격지원으로 조치해주십니다. (10분 이내)\n (cc. <@U08L6553LEL>)',
  btn_desk: '*[:busts_in_silhouette:구성원 자리 확인]* \n구성원 자리는 아래 자리배치도에서 확인 가능합니다. :blush:\n<https://docs.google.com/spreadsheets/d/1fpPfYgudlI0uDqAn3r9wR2HYkrmZysZaz7fyPqs-bIQ/edit?gid=10814374#gid=10814374|바이트랩 자리배치도>',
};

// --- 담당자 호출 버튼 (오피스 채널에서만 보여줄 것) ---
const getCallManagerBlock = (action_id) => ([
  {
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: '담당자 호출 🚩',
        },
        style: 'primary',
        action_id: action_id,
      },
    ],
  },
]);

// --- 담당자 호출 버튼 클릭 시 메시지 ---
const callManagerMessages = {
  btn_call_attendance: '잠시만 기다려주세요. (cc. <@U08L6553LEL>)',
  btn_call_vacation: '잠시만 기다려주세요. (cc. <!subteam^S07DF7YSKB4>)',
};

// --- 멘션 이벤트 - 공개 채널에서 멘션 시 버튼 메시지 띄우기 ---
app.event('app_mention', async ({ event, client }) => {
  try {
    await client.chat.postMessage({
      channel: event.channel,
      thread_ts: event.ts,
      text: '무엇을 도와드릴까요?',
      blocks: getBlocksOffice(),
    });
  } catch (error) {
    console.error('Error handling app_mention:', error);
  }
});

// --- DM에서 메시지 오면 버튼 메시지 띄우기 ---
app.event('message', async ({ event, client }) => {
  try {
    if (event.channel_type === 'im' && !event.bot_id) {
      await client.chat.postMessage({
        channel: event.channel,
        text: '무엇을 도와드릴까요? :blush:',
        blocks: getBlocksDM(),
      });
    }
  } catch (error) {
    console.error('Error handling DM message event:', error);
  }
});

// --- 오피스 채널용 버튼 클릭 이벤트 처리 ---
app.action(/btn_.+_office|btn_(repair|drive|ms_office|adobe|sandoll|other_license|docs|other_office)/, async ({ ack, body, client, action }) => {
  await ack();
  const channel = body.channel.id;
  const actionId = action.action_id;

  if (actionId === 'btn_attendance_office' || actionId === 'btn_vacation_office') {
    // 근태/연차 문의 - 기본 텍스트 + 담당자 호출 버튼 추가
    const baseText = officeMessages[actionId];
    try {
      // 기본 안내 메시지 보내기 (스레드 또는 일반)
      await client.chat.postMessage({
        channel,
        thread_ts: body.message.ts,
        text: baseText,
        blocks: [
          {
            type: 'section',
            text: { type: 'mrkdwn', text: baseText },
          },
          ...getCallManagerBlock(actionId === 'btn_attendance_office' ? 'btn_call_attendance' : 'btn_call_vacation'),
        ],
      });
    } catch (e) {
      console.error('Error sending attendance/vacation office message:', e);
    }
  } else {
    // 일반 버튼 클릭 시 단순 텍스트 안내 (스레드 또는 일반)
    const text = officeMessages[actionId] || '알 수 없는 요청입니다.';
    try {
      await client.chat.postMessage({
        channel,
        thread_ts: body.message.ts,
        text,
      });
    } catch (e) {
      console.error('Error sending office message:', e);
    }
  }
});

// --- 오피스 채널 담당자 호출 버튼 클릭 처리 ---
app.action(/btn_call_(attendance|vacation)/, async ({ ack, body, client, action }) => {
  await ack();
  const channel = body.channel.id;
  const actionId = action.action_id;

  const text = callManagerMessages[actionId] || '담당자를 호출합니다.';
  try {
    await client.chat.postMessage({
      channel,
      thread_ts: body.message.ts,
      text,
    });
  } catch (e) {
    console.error('Error sending call manager message:', e);
  }
});

// --- DM용 버튼 클릭 이벤트 처리 ---
app.action(/btn_.+_dm|btn_(oa|printer|desk)/, async ({ ack, body, client, action }) => {
  await ack();
  const channel = body.channel.id;
  const actionId = action.action_id;

  const text = dmMessages[actionId] || '알 수 없는 요청입니다.';
  try {
    await client.chat.postMessage({
      channel,
      text,
    });
  } catch (e) {
    console.error('Error sending DM message:', e);
  }
});

// 헬스체크용 기본 GET 라우터
receiver.router.get('/', (req, res) => {
  res.send('Slack HelpBot is running ✅');
});

// 서버 시작
(async () => {
  const port = process.env.PORT || 10000;
  await app.start(port);
  console.log('⚡ HelpBot is running on port', port);
})();
