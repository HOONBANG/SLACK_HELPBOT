const { App, ExpressReceiver } = require('@slack/bolt');
require('dotenv').config();

// ExpressReceiver 초기화 (커스텀 이벤트 및 인터랙션 경로)
const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  endpoints: {
    events: '/slack/events',
    actions: '/slack/interactions',
  },
});

// Slack App 초기화
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver,
  appToken: process.env.SLACK_APP_TOKEN,
  socketMode: false,
  port: process.env.PORT || 10000,
});

// 관리자 호출용 공개 채널 및 담당자 ID
const channelId = 'C096E2QQN49';    // 테스트용 공개 채널
const managerId = 'U08L6553LEL';    // 담당자 유저 ID

// 대화 상태 저장소 (메모리)
let userState = {}; // { userId: { step: '', requestText: '', lastActionId: '' } }

// 최초 13개 버튼 UI (기존 UI 그대로 유지)
const Blocks = () => ([
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
      { type: 'button', text: { type: 'plain_text', text: ':clock10:근태 문의' }, action_id: 'btn_attendance' },
      { type: 'button', text: { type: 'plain_text', text: ':palm_tree:연차 문의' }, action_id: 'btn_vacation' },
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
      { type: 'button', text: { type: 'plain_text', text: ':toolbox:OA존 물품' }, action_id: 'btn_oa' },
      { type: 'button', text: { type: 'plain_text', text: ':printer:복합기 연결' }, action_id: 'btn_printer' },
      { type: 'button', text: { type: 'plain_text', text: ':busts_in_silhouette:구성원 자리 확인' }, action_id: 'btn_desk' },
      { type: 'button', text: { type: 'plain_text', text: '기타 요청' }, action_id: 'btn_other_office' },
    ],
  },
]);

// 13개 버튼 메시지 내용 (기존 메시지 그대로 유지)
const Messages = {
  btn_repair: '*[:computer:장비 수리]* \n언제부터 어떤 증상이 있었는지 자세히 말씀해주세요. (cc. <@U08L6553LEL>) \n• 시점: \n• 증상:',
  btn_drive: '*[:drive_icon:구글 드라이브]* \n어떤 도움이 필요하신가요? (cc. <@U08L6553LEL>) \n• 내용: 드라이브 이동 / 권한 설정 \n• 사유:',
  btn_ms_office: '*[MS OFFICE]* \n업무 상 불가피한 경우(ex. 비밀번호가 걸린 엑셀 파일)가 아니라면 구글 워크스페이스를 활용해 주세요.\n불가피한 경우에는 <#C04NUTT5771|chat_office> 채널에 요청 사유와 함께 요청해 주세요. (cc. <@U08L6553LEL>)',
  btn_adobe: '*[ADOBE]* \n어떤 프로그램이 필요하신가요? (cc. <@U08L6553LEL>)\n• Photoshop\n• Premiere Pro\n• Illustrator\n• 기타',
  btn_sandoll: '*[산돌구름]* \n회사 구글 계정으로 산돌구름 회원가입 후 말씀 주세요. 😊 (cc. <@U08L6553LEL>)',
  btn_other_license: '*[기타 라이선스]* \n필요한 제품과 요청 사유를 말씀 주세요. 😊 (cc. <@U08L6553LEL>)',
  btn_attendance: '*[:clock10:근태 문의]*\n바이트랩 근태는 <https://docs.google.com/spreadsheets/d/1fpPfYgudlI0uDqAn3r9wR2HYkrmZysZaz7fyPqs-bIQ/edit?gid=10814374#gid=10814374|바이트랩 근무 생활> 페이지에서 확인하실 수 있습니다. \n\n*:alarm_clock:시차 출퇴근제*\n바이트랩은 9시-10시 사이에 자유롭게 출퇴근 시간을 선택하고 8시간 근무하는 시차 출퇴근제를 통해 유연 근무를 하고 있어요. \n사무실 입구의 출입 인식기를 통해 flex에 출퇴근 시간을 기록하니 출근/퇴근 시에 잊지 말고 꼭 기록을 남겨주세요! \n\n*:baby::skin-tone-2:육아 시, 유연근무 확대*\n자녀 육아하시는 멤버시라면 8:30~10:30까지 확대된 유연 근무가 적용돼요! 행복한 육아 생활이 되시길 바랍니다! \n\n*:runner::skin-tone-2:외근 관련 안내*\n외근을 나가시고 현장에서 퇴근하신다면, 외근 나가실 때 출입 인식기에서 퇴근을 태그해주시고 flex에서 외근을 등록해주세요! 잠깐 외근 가셨다 돌아오는 일정이라면 외근 신청만 올려주시면 됩니다.',
  btn_vacation: '*[:palm_tree:연차 문의]* \n연차는 1주일 전 미리 플렉스를 통해 등록해주시고 팀원들에게 미리 공유해주세요! \n연차는 사유를 묻지 않으나, 부득이한 당일 연차라면 반드시 사유를 남기신 뒤에 워크플로우를 상신해주시면 됩니다.:smile: \n자세한 연차 제도 안내는 아래 노션 팀 생활 엿보기 페이지에서 볼 수 있어요! \n<https://www.notion.so/12934579dc0180c89fd4ee682628098b#12934579dc0180a787bddb3d2090f1b4|바이트랩 팀 생활 엿보기>',
  btn_docs: '*[:pencil:서류 발급 요청]* \n어떤 서류가 필요하신가요? 😊 (cc. <!subteam^S07DF7YSKB4>)',
  btn_oa: '*[:toolbox:OA존 물품]* \n사무실 OA존에는 스테이플러, 포스트잇, 투명 파일 등 업무에 필요한 사무용품들이 보관되어 있어요! \n\n업무에 필수적이지만 OA존에 없는 사무용품이 있을 경우 <https://flex.team/workflow/archive/my?tab=in-progress&workflow-action=create&workflow-template-key=fd1367a24e2743e3ad18e5f112cd50de|비품 신청 워크플로우>를 작성해주시면 됩니다. :blush:',
  btn_printer: '*[:printer:복합기 연결]* \n복합기 연결 및 사용에 어려움이 있으신 경우,\n아래 두 가지 방법을 통해 지원을 받으실 수 있습니다. :blush:\n\n1. 복합기 상단 QR코드 통해 A/S 요청\n2. 복합기 업체 연락 - 제이에이솔루션 1566-3505\n※ 바이트랩 직원이라고 말씀하시면, 원격지원으로 조치해주십니다. (10분 이내)',
  btn_desk: '*[:busts_in_silhouette:구성원 자리 확인]* \n구성원 자리는 아래 링크에서 확인 가능합니다. \n<https://docs.google.com/spreadsheets/d/1fpPfYgudlI0uDqAn3r9wR2HYkrmZysZaz7fyPqs-bIQ/edit?gid=10814374#gid=10814374|바이트랩 자리배치도>',
  btn_other_office: '*[기타 요청]* \n어떤 도움이 필요하신가요? 😊 (cc. <@U08L6553LEL>)',
};

// 담당자 호출이 가능한 버튼 리스트
const callManagerButtons = new Set([
  'btn_repair',
  'btn_drive',
  'btn_ms_office',
  'btn_adobe',
  'btn_sandoll',
  'btn_other_license',
  'btn_docs',
  'btn_other_office',
]);

// DM에 메시지 오면 13개 버튼 전송 (최초 안내)
app.event('message', async ({ event, client }) => {
  try {
    if (event.channel_type === 'im' && !event.bot_id) {
      await client.chat.postMessage({
        channel: event.channel,
        text: '무엇을 도와드릴까요? :blush:',
        blocks: Blocks(),
      });
    }
  } catch (error) {
    console.error('Error handling DM message event:', error);
  }
});

// 버튼 클릭 이벤트 처리
app.action(/^(btn_.*)$/, async ({ ack, body, client }) => {
  await ack();

  const channelIdDM = body.channel.id;
  const threadTs = body.message.ts;
  const actionId = body.actions[0].action_id;
  const userId = body.user.id;

  // 담당자 호출 버튼 클릭 처리
  if (actionId === 'btn_call_manager') {
    const requestText = userState[userId]?.requestText || '';

    if (!requestText) {
      await client.chat.postMessage({
        channel: channelIdDM,
        thread_ts: threadTs,
        text: "요청 내용이 없습니다. 다시 시도해주세요.",
      });
      return;
    }

    // 공개 채널에 메시지 전송
    await client.chat.postMessage({
      channel: channelId,
      text: `<@${managerId}> 확인 부탁드립니다.\n*요청자:* <@${userId}>\n*내용:* ${requestText}`,
    });

    await client.chat.postMessage({
      channel: channelIdDM,
      thread_ts: threadTs,
      text: "담당자에게 요청을 전달했습니다. 잠시만 기다려주세요.",
    });

    // 상태 초기화
    delete userState[userId];
    return;
  }

  // 다시 작성 버튼 처리
  if (actionId === 'btn_rewrite') {
    userState[userId] = { step: 'waiting_detail', requestText: '', lastActionId: userState[userId]?.lastActionId || '' };
    await client.chat.postMessage({
      channel: channelIdDM,
      thread_ts: threadTs,
      text: "다시 요청 내용을 입력해주세요.",
    });
    return;
  }

  // 13개 버튼 클릭 시
  const text = Messages[actionId];
  if (!text) {
    // 안전장치: 정의되지 않은 버튼 actionId 처리 무시
    return;
  }

  try {
    // 메시지 먼저 스레드에 보냄
    await client.chat.postMessage({
      channel: channelIdDM,
      thread_ts: threadTs,
      text,
    });

    // 요청 상세 입력 유도
    if (actionId === 'btn_repair') {
      userState[userId] = { step: 'waiting_detail', requestText: '', lastActionId: actionId };
      await client.chat.postMessage({
        channel: channelIdDM,
        thread_ts: threadTs,
        text: "어떤 도움이 필요하신지 말씀해주세요.",
      });
    } else {
      userState[userId] = { step: 'waiting_detail', requestText: `[${body.actions[0].text.text}] 요청`, lastActionId: actionId };
      await client.chat.postMessage({
        channel: channelIdDM,
        thread_ts: threadTs,
        text: "요청 내용을 구체적으로 입력해주세요.",
      });
    }
  } catch (e) {
    console.error('Error handling button action:', e);
  }
});

// 사용자가 요청 상세 입력 시 처리
app.message(async ({ message, say }) => {
  if (message.channel_type === 'im' && !message.bot_id) {
    const userId = message.user;
    const text = message.text?.trim();

    if (userState[userId] && userState[userId].step === 'waiting_detail') {
      userState[userId].requestText = text;
      userState[userId].step = 'confirm_request';

      await say({
        text: "이런 내용의 도움이 필요하신가요?",
        blocks: [
          {
            type: "section",
            text: { type: "mrkdwn", text: `이런 내용의 도움이 필요하신가요?\n>${text}` },
          },
          {
            type: "actions",
            elements: [
              // 담당자 호출 버튼은 특정 버튼 클릭 후에만 노출
              ...(callManagerButtons.has(userState[userId].lastActionId) ? [
                { type: "button", text: { type: "plain_text", text: "담당자 호출" }, action_id: "btn_call_manager" }
              ] : []),
              { type: "button", text: { type: "plain_text", text: "다시 작성" }, action_id: "btn_rewrite" }
            ],
          },
        ],
      });
    }
  }
});

// 헬스체크 라우터
receiver.app.get('/', (req, res) => {
  res.send('Slack HelpBot is running ✅');
});

// 서버 시작
(async () => {
  const port = process.env.PORT || 10000;
  await app.start(port);
  console.log('⚡ HelpBot is running on port', port);
})();
