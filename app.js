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
const Messages = {
  btn_repair: '*[:computer:장비 수리]* \n언제부터 어떤 증상이 있었는지 자세히 말씀해주세요. \n• 시점: \n• 증상:',
  btn_drive: '*[:drive_icon:구글 드라이브]* \n어떤 도움이 필요하신지 말씀해주세요.\n• 내용: 드라이브 이동 / 권한 설정 \n• 목적:',
  btn_ms_office: '*[MS OFFICE]* \n업무 상 불가피한 경우(ex. 비밀번호가 걸린 엑셀 파일)가 아니라면 구글 워크스페이스를 활용해 주세요.\n불가피한 경우에는 MS Office 사용 목적을 말씀해주세요.\n• 목적:',
  btn_adobe: '*[ADOBE]* \n필요하신 라이선스와 사용 목적을 말씀해주세요.\n• 라이선스: Photoshop / Premiere Pro / Illustrator / 기타\n• 목적:',
  btn_sandoll: '*[산돌구름]* \n<https://www.sandollcloud.com/|산돌구름 홈페이지>에서 회사 구글 계정으로 회원가입(개인)이 필요합니다.\n회원가입 후 등록하실 구글 계정을 말씀해주세요.\n• ex) jake.cho@bitelab.co.kr',
  btn_other_license: '*[기타 라이선스]* \nMS OFFICE, ADOBE, 산돌구름 외 라이선스가 필요하실 경우, \n<https://flex.team/workflow/archive/my?tab=in-progress&workflow-action=create&workflow-template-key=990b2273a74544b3b57dd47bacb4581b|신규 구독 결제 요청> 워크플로우 작성 부탁드립니다.',
  btn_attendance: '*[:clock10:근태 문의]*\n바이트랩 근태는 <https://docs.google.com/spreadsheets/d/1fpPfYgudlI0uDqAn3r9wR2HYkrmZysZaz7fyPqs-bIQ/edit?gid=10814374#gid=10814374|바이트랩 근무 생활> 페이지에서 확인하실 수 있습니다. \n\n*:alarm_clock:시차 출퇴근제*\n바이트랩은 9시-10시 사이에 자유롭게 출퇴근 시간을 선택하고 8시간 근무하는 시차 출퇴근제를 통해 유연 근무를 하고 있어요. \n사무실 입구의 출입 인식기를 통해 flex에 출퇴근 시간을 기록하니 출근/퇴근 시에 잊지 말고 꼭 기록을 남겨주세요! \n\n*:baby::skin-tone-2:육아 시, 유연근무 확대*\n자녀 육아하시는 멤버시라면 8:30~10:30까지 확대된 유연 근무가 적용돼요! 행복한 육아 생활이 되시길 바랍니다! \n\n*:runner::skin-tone-2:외근 관련 안내*\n외근을 나가시고 현장에서 퇴근하신다면, 외근 나가실 때 출입 인식기에서 퇴근을 태그해주시고 flex에서 외근을 등록해주세요! 잠깐 외근 가셨다 돌아오는 일정이라면 외근 신청만 올려주시면 됩니다.',
  btn_vacation: '*[:palm_tree:연차 문의]* \n연차는 1주일 전 미리 플렉스를 통해 등록해주시고 팀원들에게 미리 공유해주세요! \n연차는 사유를 묻지 않으나, 부득이한 당일 연차라면 반드시 사유를 남기신 뒤에 워크플로우를 상신해주시면 됩니다.:smile: \n자세한 연차 제도 안내는 아래 노션 팀 생활 엿보기 페이지에서 볼 수 있어요! \n<https://www.notion.so/12934579dc0180c89fd4ee682628098b#12934579dc0180a787bddb3d2090f1b4|바이트랩 팀 생활 엿보기>',
  btn_docs: '*[:pencil:서류 발급 요청]* \n필요하신 서류와 발급 목적을 말씀해주세요. \n• 요청 서류: \n• 발급 목적:',
  btn_oa: '*[:toolbox:OA존 물품]* \n사무실 OA존에는 스테이플러, 포스트잇, 투명 파일 등 업무에 필요한 사무용품들이 보관되어 있어요! \n\n업무에 필수적이지만 OA존에 없는 사무용품이 있을 경우 <https://flex.team/workflow/archive/my?tab=in-progress&workflow-action=create&workflow-template-key=fd1367a24e2743e3ad18e5f112cd50de|비품 신청 워크플로우>를 작성해주시면 됩니다. :blush:',
  btn_printer: '*[:printer:복합기 연결]* \n복합기는 <https://www.notion.so/63bc4239f470436abf83077e7152a635?source=copy_link#55c02590188b4dfd88923711bf303804|복합기 설정> 페이지에 적힌 설명을 참고하여 설치해주시면 스캔, 인쇄 등에 활용하실 수 있습니다. \n\n만약 복합기 연결 및 사용에 어려움이 있으신 경우, 업체에 직접 지원을 요청해주시면 가장 빠르게 도움 받으실 수 있습니다. 아래 2가지 방법 중 편하신 방법으로 요청해주세요.\n1. 복합기 상단 QR코드 통해 A/S 요청\n2. 복합기 업체(1566-3505)로 전화하셔서 "바이트랩 직원"이라고 말씀하시면, 원격 지원을 받을 수 있습니다. (10분 이내)',
  btn_desk: '*[:busts_in_silhouette:구성원 자리 확인]* \n구성원 자리는 아래 링크에서 확인 가능합니다. \n<https://docs.google.com/spreadsheets/d/1fpPfYgudlI0uDqAn3r9wR2HYkrmZysZaz7fyPqs-bIQ/edit?gid=10814374#gid=10814374|바이트랩 자리배치도>',
  btn_other_office: '*[기타 요청]* \n어떤 도움이 필요하신가요? 😊',
};

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
