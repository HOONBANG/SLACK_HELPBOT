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

// --- DM 여부 체크 함수 ---
const isDM = (channelId) => channelId.startsWith('D');

// --- 오피스 채널용 버튼 블록 ---
const BlockOffice = () => ([
  {
    type: 'section',
    text: {
      type: 'plain_text',
      text: '안녕하세요! 무엇을 도와드릴까요? 😊',
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
const BlockDM = () => ([
  {
    type: 'section',
    text: {
      type: 'plain_text',
      text: '안녕하세요! 무엇을 도와드릴까요? 😊',
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

// --- 담당자 호출 버튼 ---
const BlockCallManager = (managerName) => ([
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
        action_id: `call_${managerName}`, // ex) call_훈

      },
    ],
  },
]);

// --- 메시지 정의 ---
const officeMessages = {
  btn_repair: '*[:computer:장비 수리]* \n언제부터 어떤 증상이 있었는지 자세히 말씀해주세요. (cc. <@U08L6553LEL>) \n• 시점: \n• 증상:',
  btn_drive: '*[:drive_icon:구글 드라이브]* \n어떤 도움이 필요하신가요? (cc. <@U08L6553LEL>) \n• 내용: 드라이브 이동 / 권한 설정 \n• 사유:',
  btn_ms_office: '*[MS OFFICE]* \n업무 상 불가피한 경우(ex. 비밀번호가 걸린 엑셀 파일)가 아니라면 구글 워크스페이스를 활용해 주세요.\n불가피한 경우에는 <#C04NUTT5771|chat_office> 채널에 요청 사유와 함께 요청해 주세요. (cc. <@U08L6553LEL>)',
  btn_adobe: '*[ADOBE]* \n어떤 프로그램이 필요하신가요? (cc. <@U08L6553LEL>)\n• Photoshop\n• Premiere Pro\n• Illustrator\n• 기타',
  btn_sandoll: '*[산돌구름]* \n회사 구글 계정으로 산돌구름 회원가입 후 말씀 주세요. 😊 (cc. <@U08L6553LEL>)',
  btn_other_license: '*[기타 라이선스]* \n필요한 제품과 요청 사유를 말씀 주세요. 😊 (cc. <@U08L6553LEL>)',
  btn_attendance_office: '*[:clock10:근태 문의]* \n근태 관련 내용은 여기서 확인하세요!',
  btn_vacation_office: '*[:palm_tree:연차 문의]* \n연차 관련 내용은 여기서 확인하세요!',
  btn_docs: '*[:pencil:서류 발급 요청]* \n어떤 서류가 필요하신가요? 😊 (cc. <!subteam^S07DF7YSKB4>)',
  btn_other_office: '*[기타 요청]* \n어떤 도움이 필요하신가요? 😊 (cc. <@U08L6553LEL>)',
};

const dmMessages = {
  btn_repair_dm: '*[:computer:장비 수리]* \n장비 수리 가이드 작성 예정 😊',
  btn_attendance_dm: '*[:clock10:근태 문의]* \n바이트랩은 9시-10시 사이에 자유롭게 출퇴근 시간을 선택하고 8시간 근무하는 "시차 출퇴근제"를 통해 유연 근무를 하고 있어요. 사무실 입구의 출입 인식기를 통해 flex에 출퇴근 시간을 기록하니 출근, 퇴근 시에 잊지 말고 꼭 기록을 남겨주세요! 👶🏼행복한 육아 생활이 되길 바라며 자녀 육아하시는 멤버시라면 08시 30분-10시 30분까지 확대된 유연 근무가 적용돼요! 🏃🏼외근을 나가시고 현장에서 퇴근하신다면, 외근 나가실 때 출입 인식기에서 퇴근을 태그해주시고 flex에서 외근을 등록해주세요! 잠깐 외근 가셨다 돌아오는 일정이라면 외근 신청만 올려주시면 됩니다.', 
  btn_vacation_dm: '*[:palm_tree:연차 문의]* \n연차는 1주일 전 미리 플렉스를 통해 등록해주시고 팀원들에게 미리 공유해주세요! \n연차는 사유를 묻지 않으나, 부득이한 당일 연차라면 반드시 사유를 남기신 뒤에 워크플로우를 상신해주시면 됩니다.:smile: \n자세한 연차 제도 안내는 아래 노션 팀 생활 엿보기 페이지에서 볼 수 있어요! \n<https://www.notion.so/12934579dc0180c89fd4ee682628098b#12934579dc0180a787bddb3d2090f1b4|바이트랩 팀 생활 엿보기>',
  btn_oa: '*[:toolbox:OA존 물품]* \n어떤 OA 물품이 필요한가요? 😊',
  btn_printer: '*[:printer:복합기 연결]* \n복합기 연결이 어려우신 경우:\n1. 복합기 상단 QR코드 스캔\n2. 제이에이솔루션 1566-3505 로 전화 (바이트랩 직원임을 말씀해 주세요)',
  btn_desk: '*[:busts_in_silhouette:구성원 자리 확인]* \n<https://docs.google.com/spreadsheets/d/1fpPfYgudlI0uDqAn3r9wR2HYkrmZysZaz7fyPqs-bIQ/edit?gid=10814374#gid=10814374|바이트랩 자리배치도>',
};

// --- 공개 채널 멘션 시 응답 ---
app.event('app_mention', async ({ event, client }) => {
  try {
    await client.chat.postMessage({
      channel: event.channel,
      thread_ts: event.ts,
      text: '무엇을 도와드릴까요?',
      blocks: getBlocksOffice(),
    });
  } catch (e) {
    console.error('Error in app_mention:', e);
  }
});

// --- DM 메시지 처리 ---
app.event('message', async ({ event, client }) => {
  if (event.channel_type === 'im' && !event.bot_id) {
    try {
      await client.chat.postMessage({
        channel: event.channel,
        text: '무엇을 도와드릴까요? 😊',
        blocks: getBlocksDM(),
      });
    } catch (e) {
      console.error('Error in DM message event:', e);
    }
  }
});

// --- 오피스 채널 버튼 처리 ---
app.action(/^btn_/, async ({ ack, body, client, action }) => {
  await ack();
  const channel = body.channel.id;
  const actionId = action.action_id;
  const isAttendance = actionId === 'btn_attendance_office';
  const isVacation = actionId === 'btn_vacation_office';

  const baseText = officeMessages[actionId];
  if (isAttendance || isVacation) {
    const managerName = isAttendance ? '훈' : 'HR';
    try {
      await client.chat.postMessage({
        channel,
        thread_ts: body.message.ts,
        text: baseText,
        blocks: [
          { type: 'section', text: { type: 'mrkdwn', text: baseText } },
          ...getCallManagerBlock(managerName),
        ],
      });
    } catch (e) {
      console.error('Error sending office message:', e);
    }
  } else {
    const text = officeMessages[actionId] || dmMessages[actionId] || '알 수 없는 요청입니다.';
    try {
      await client.chat.postMessage({
        channel,
        thread_ts: body.message.ts,
        text,
      });
    } catch (e) {
      console.error('Error sending general button message:', e);
    }
  }
});

// --- 담당자 호출 버튼 처리 (모든 call_ 접두어 허용) ---
app.action(/^call_.+$/, async ({ ack, body, client, action }) => {
  await ack();
  const managerName = action.action_id.replace('call_', '');
  const text = `잠시만 기다려주세요. (cc. ${managerName})`;

  try {
    await client.chat.postMessage({
      channel: body.channel.id,
      thread_ts: body.message.ts,
      text,
    });
  } catch (e) {
    console.error('Error calling manager:', e);
  }
});

// --- 기본 라우터 (헬스체크) ---
receiver.app.get('/', (req, res) => {
  res.send('Slack HelpBot is running ✅');
});

// --- 서버 시작 ---
(async () => {
  const port = process.env.PORT || 10000;
  await app.start(port);
  console.log(`⚡ HelpBot is running on port ${port}`);
})();
