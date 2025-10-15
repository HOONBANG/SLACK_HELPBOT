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
  // btn_call_admin, btn_call_manager는 상태 저장용이 아니므로 제외
};

// --- 담당자 호출이 필요한 버튼 ---
const callManagerButtons = new Set([
  'btn_repair','btn_drive','btn_ms_office','btn_adobe','btn_sandoll','btn_other_license','btn_docs','btn_other_office'
]);

// --- 버튼 블록 정의 ---
const Blocks = () => ([
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

// 버튼별 기본 메시지 (원본 내용 유지)
const Messages = {
  btn_repair: '*[:computer:장비 수리]* \n언제부터 어떤 증상이 있었는지 자세히 말씀해주세요. \n• 시점: \n• 증상:',
  btn_drive: '*[:drive_icon:구글 드라이브]* \n어떤 도움이 필요하신지 말씀해주세요.\n• 내용: 드라이브 이동 / 권한 설정 \n• 목적:',
  btn_ms_office: '*[MS OFFICE]* \n업무 상 불가피한 경우(ex. 비밀번호가 걸린 엑셀 파일)가 아니라면 구글 워크스페이스를 활용해주세요.\n\nMS Office 요청 사유를 말씀해주세요.\n• 목적:',
  btn_adobe: '*[ADOBE]* \n필요하신 제품과 사용 목적을 말씀해주세요.\n• 제품: Photoshop / Premiere Pro / Illustrator / 기타\n• 목적:',
  btn_sandoll: '*[산돌구름]* \n1. <https://www.sandollcloud.com/|산돌구름 홈페이지>에서 회사 구글 계정으로 회원가입(개인)이 필요합니다.\n2. 회원가입 후 등록하실 구글 계정을 말씀해주세요.\n\n• ex) help.bot@bitelab.co.kr',
  btn_other_license: '*[기타 라이선스]* \nMS OFFICE, ADOBE, 산돌구름 외 라이선스가 필요하실 경우, \n<https://flex.team/workflow/archive/my?tab=in-progress&workflow-action=create&workflow-template-key=990b2273a74544b3b57dd47bacb4581b|신규 구독 결제 요청> 워크플로우 작성 부탁드립니다.',
  btn_attendance: '*[:clock10:근태 안내]*\n바이트랩 근태는 <https://www.notion.so/12934579dc0180c89fd4ee682628098b?source=copy_link#12934579dc018008b946e608833ae20c|바이트랩 근무 생활> 페이지에서 확인하실 수 있습니다. \n\n*:alarm_clock:시차 출퇴근제*\n바이트랩은 9시-10시 사이에 자유롭게 출퇴근 시간을 선택하고 8시간 근무하는 시차 출퇴근제를 통해 유연 근무를 하고 있어요. \n사무실 입구의 출입 인식기를 통해 flex에 출퇴근 시간을 기록하니 출근/퇴근 시에 잊지 말고 꼭 기록을 남겨주세요! \n\n*:baby::skin-tone-2:육아 시, 유연근무 확대*\n자녀 육아하시는 멤버시라면 8:30~10:30까지 확대된 유연 근무가 적용돼요! 행복한 육아 생활이 되시길 바랍니다! \n\n*:runner::skin-tone-2:외근 관련 안내*\n외근을 나가시고 현장에서 퇴근하신다면, 외근 나가실 때 출입 인식기에서 퇴근을 태그해주시고 flex에서 외근을 등록해주세요! 잠깐 외근 가셨다 돌아오는 일정이라면 외근 신청만 올려주시면 됩니다.',
  btn_vacation: '*[:palm_tree:연차 안내]* \n연차는 일주일 전 미리 플렉스를 통해 등록해주시고 팀원들에게 공유해주세요! \n연차는 사유를 묻지 않으나, 부득이한 당일 연차라면 반드시 사유를 남기신 뒤에 워크플로우를 상신해주시면 됩니다. \n자세한 연차 제도 안내는 아래 노션 팀 생활 엿보기 페이지에서 볼 수 있어요! \n<https://www.notion.so/12934579dc0180c89fd4ee682628098b#12934579dc0180a787bddb3d2090f1b4|바이트랩 팀 생활 엿보기>',
  btn_docs: '*[:pencil:서류 발급 요청]* \n필요하신 서류와 발급 목적을 말씀해주세요. \n• 요청 서류: \n• 발급 목적:',
  btn_oa: '*[:toolbox:OA존 물품]* \n사무실 OA존에는 업무에 필요한 사무용품들이 보관되어 있습니다.\nOA존에 없는 사무용품이 필요하실 경우, <https://flex.team/workflow/archive/my?tab=in-progress&workflow-action=create&workflow-template-key=fd1367a24e2743e3ad18e5f112cd50de|비품 신청 워크플로우>를 통해 신청 부탁드립니다.\n\n*:file_folder:문서 정리 및 보관류*\n• L자 파일홀더, 정부파일, 용지(A3,A4), 포스트잇, 견출지\n\n*:pencil2:필기구류*\n• 노트, 형광펜, 삼생볼펜, 네임펜, 수정테이프, 보드마카/지우개\n\n*:scissors:문서 편집 및 수정보조*\n• 칼, 가위, 풀, 테이프, 스테이플러, 펀칭기, 코팅기\n\n*:battery:기타 사무용품*\n• 건전지\n\n*:pill:구급상자*\n• 상비약, 반창고, 소독약, 알콜스왑, 압박붕대 등',
  btn_printer: '*[:printer:복합기 연결]* \n복합기는 <https://www.notion.so/63bc4239f470436abf83077e7152a635?source=copy_link#55c02590188b4dfd88923711bf303804|복합기 설정> 페이지에 적힌 설명을 참고하여 설치해주시면 스캔, 인쇄 등에 활용하실 수 있습니다. \n\n만약 복합기 연결 및 사용에 어려움이 있으신 경우, 업체에 직접 지원을 요청해주시면 가장 빠르게 도움 받으실 수 있습니다. 아래 2가지 방법 중 편하신 방법으로 요청해주세요.\n1. 복합기 상단 QR코드 통해 A/S 요청\n2. 복합기 업체(1566-3505)로 전화하셔서 "바이트랩 직원"이라고 말씀하시면, 원격 지원을 받을 수 있습니다. (10분 이내)',
  btn_desk: '*[:busts_in_silhouette:구성원 자리 확인]* \n구성원 자리는 아래 링크에서 확인 가능합니다. \n<https://docs.google.com/spreadsheets/d/1fpPfYgudlI0uDqAn3r9wR2HYkrmZysZaz7fyPqs-bIQ/edit?gid=10814374#gid=10814374|바이트랩 자리배치도>',
  btn_admin: '*[2차 인증번호 요청]* \ncontact@bitelab.co.kr 계정의 2차 인증이 필요하신 경우, 담당자를 호출해주세요. 😊',
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

// --- 버튼 클릭 처리 (모든 btn_ 액션을 이 하나의 핸들러에서 처리) ---
app.action(/^(btn_.*)$/, async ({ ack, body, client, action }) => {
  await ack();

  const userId = body.user.id;
  const channelIdDM = body.channel.id;
  const threadTs = body.message.ts;
  const actionId = action.action_id;
  const state = userState[userId];


  // 1. btn_admin 처리: 요청 내용 없이 담당자 호출 버튼만 표시
  if (actionId === 'btn_admin') {
    await client.chat.postMessage({
      channel: channelIdDM,
      thread_ts: threadTs,
      text: '2차 인증번호 요청 안내',
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: Messages[actionId],
          },
        },
        {
          type: 'actions',
          elements: [
            { type: 'button', text: { type: 'plain_text', text: ':bellhop_bell: 담당자 호출' }, style: 'primary', action_id: 'btn_call_admin' },
          ],
        },
      ],
    });
    userState[userId] = {
      step: 'admin',
      threadTs,
      lastActionId: actionId,
      lastActionText: actionIdToTitle[actionId],
    };
    return; // 로직 종료
  }

  // 2. btn_call_admin 처리: 담당자 호출 (2차 인증 요청)
  if (actionId === 'btn_call_admin') {
    // state는 필요 없지만, userState[userId]를 사용하기 위해 정의.
    const state = userState[userId] || { threadTs: body.message.thread_ts || body.message.ts }; 

    const result = await client.chat.postMessage({
      channel: channelId,
      text: `<@${managerId}> 확인 부탁드립니다. (2차 인증 요청)`
    });

    await client.chat.postMessage({
    channel: channelId,
    thread_ts: result.ts,
    text: `*요청자:* <@${userId}>`
    });

    await client.chat.postMessage({
      channel: channelIdDM,
      thread_ts: state.threadTs,
      text: "담당자에게 2차 인증 요청을 전달했습니다. 잠시만 기다려주세요.",
    });

    delete userState[userId];
    return; // 로직 종료
  }

  // 3. btn_call_manager 처리: 담당자 호출 (상세 요청 내용 포함)
  // 이 로직을 별도 핸들러에서 이동시켜, 글로벌 핸들러에 의해 무시되지 않도록 합니다.
  if (actionId === 'btn_call_manager') {
    if (!state) return; // 상태가 없으면 무시

    const requestText = state.requestText || '';
    const actionText = state.lastActionText || '';

    // 공개 채널에 알림
    const result = await client.chat.postMessage({
      channel: channelId,
      text: `<@${managerId}> 확인 부탁드립니다.`,
    });

    // 요청 내용이 있으면 스레드에 포함
    if (requestText) {
      const quotedText = requestText.split('\n').map(l => `> ${l}`).join('\n');
      await client.chat.postMessage({
        channel: channelId,
        thread_ts: result.ts,
        text: `*[${actionText}]*\n*요청자:* <@${userId}>\n*내용:*\n${quotedText}`,
      });
    }

    // DM 안내
    await client.chat.postMessage({
      channel: state.threadTs,
      thread_ts: state.threadTs,
      text: "담당자에게 요청을 전달했습니다. 잠시만 기다려주세요.",
    });

    delete userState[userId];
    return; // 로직 종료
  }

  // 4. btn_rewrite 처리: 다시 작성
  if (actionId === 'btn_rewrite') {
    const prevState = userState[userId];
    const threadTsNew = body.message.thread_ts || body.message.ts;
    userState[userId] = {
      step: 'waiting_detail',
      requestText: '',
      threadTs: threadTsNew,
      lastActionId: prevState?.lastActionId || '',
      lastActionText: prevState?.lastActionText || '',
    };
    await client.chat.postMessage({ channel: channelIdDM, thread_ts: threadTsNew, text: "다시 요청 내용을 입력해주세요." });
    return; // 로직 종료
  }

  // 5. 일반 요청 버튼 클릭: 기본 메시지 + 상태 저장 (위에 처리되지 않은 모든 btn_ 액션)
  const baseText = Messages[actionId];
  if (!baseText) {
    // 혹시라도 위에서 처리되지 않은 예상치 못한 btn_ 액션이 들어오면 여기서 종료됩니다.
    console.warn(`[WARN] Unhandled actionId reached final return: ${actionId}`);
    return; 
  }

  // 기본 메시지 포스트
  await client.chat.postMessage({ channel: channelIdDM, thread_ts: threadTs, text: baseText });

  // 상태 저장
  if (callManagerButtons.has(actionId)) {
    userState[userId] = {
      step: 'waiting_detail',
      requestText: '',
      threadTs,
      lastActionId: actionId,
      lastActionText: actionIdToTitle[actionId],
    };
  } else {
    userState[userId] = {
      step: 'none',
      requestText: '',
      threadTs,
      lastActionId: actionId,
      lastActionText: actionIdToTitle[actionId],
    };
  }
});
// 기존의 app.action('btn_call_manager', ...) 블록은 위로 통합되어 제거되었습니다.


// --- DM에서 상세 요청 입력 처리 ---
app.message(async ({ message, client }) => {
  if (message.channel_type !== 'im' || message.bot_id) return;

  const userId = message.user;
  const text = message.text?.trim();
  const state = userState[userId];

  if (!state || state.step !== 'waiting_detail') return;

  const isThreadMatched = message.thread_ts === state.threadTs || (!message.thread_ts && message.ts === state.threadTs);
  if (!isThreadMatched) return;

  // 요청 내용 저장
  state.requestText = text;
  state.step = 'confirm_request';

  const quotedText = text.split('\n').map(l => `> ${l}`).join('\n');

  await client.chat.postMessage({
    channel: message.channel,
    thread_ts: state.threadTs,
    text: '이런 내용의 도움이 필요하신가요?',
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: `이런 내용의 도움이 필요하신가요?\n${quotedText}` },
      },
      {
        type: 'actions',
        elements: [
          // 수정 사항: 담당자 호출 버튼은 이제 위 통합 핸들러에서 처리됩니다.
          { type: 'button', text: { type: 'plain_text', text: ':bellhop_bell:담당자 호출' }, style: 'primary', action_id: 'btn_call_manager' }, 
          { type: 'button', text: { type: 'plain_text', text: '다시 작성' }, action_id: 'btn_rewrite' },
        ],
      },
    ],
  });
});

// --- 헬스체크 라우터 ---
receiver.app.get('/', (req, res) => res.send('Slack HelpBot is running ✅'));

// --- 서버 시작 ---
const PORT = process.env.PORT || 10000;
(async () => {
  await app.start(PORT);
  console.log('⚡ HelpBot is running on port', PORT);
})();
