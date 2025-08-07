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

// 1) 오피스 채널(공개채널) 버튼 블록 생성 함수
const getOfficeBlocks = () => [
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
      { type: 'button', text: { type: 'plain_text', text: '기타 요청' }, action_id: 'btn_other_office' },
    ],
  },
];

// 2) DM용 버튼 블록 생성 함수
const getDmBlocks = () => [
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
      { type: 'button', text: { type: 'plain_text', text: ':computer:장비 수리' }, action_id: 'btn_repair' },
      { type: 'button', text: { type: 'plain_text', text: ':clock10:근태 문의' }, action_id: 'btn_attendance' },
      { type: 'button', text: { type: 'plain_text', text: ':palm_tree:연차 문의' }, action_id: 'btn_vacation' },
      { type: 'button', text: { type: 'plain_text', text: ':toolbox:OA존 물품' }, action_id: 'btn_oa' },
      { type: 'button', text: { type: 'plain_text', text: ':printer:복합기 연결' }, action_id: 'btn_printer' },
      { type: 'button', text: { type: 'plain_text', text: ':busts_in_silhouette:구성원 자리 확인' }, action_id: 'btn_desk' },
    ],
  },
];

// 3) 오피스 채널 버튼별 응답 메시지
const officeButtonActions = {
  btn_repair: '*[:computer:장비 수리]* \n언제부터 어떤 증상이 있었는지 자세히 말씀해주세요. (cc. <@U08L6553LEL>) \n• 시점: \n• 증상:',
  btn_drive: '*[:drive_icon:구글 드라이브]* \n어떤 도움이 필요하신가요? (cc. <@U08L6553LEL>) \n• 내용: 드라이브 이동 / 권한 설정 \n• 사유:',
  btn_ms_office: '*[MS OFFICE]* \n업무 상 MS OFFICE가 필요하신 경우가 있는지 말씀 부탁드립니다. (cc. <@U08L6553LEL>) \n\n※ 구글 워크스페이스 내 스프레드시트를 활용하고 있어 MS office를 전사 단위로 구매하고 있지 않습니다.',
  btn_adobe: '*[ADOBE]* \n어떤 프로그램이 필요하신가요? (cc. <@U08L6553LEL>) \n\n• Photoshop \n• Premiere Pro \n• Illustrator \n• 기타',
  btn_sandoll: '*[산돌구름]* \n회사 구글 계정으로 산돌구름 회원가입(개인) 후 말씀 부탁드립니다. :blush: \n (cc. <@U08L6553LEL>)',
  btn_other_license: '*[기타 라이선스]* \n필요하신 라이선스 제품과 요청 사유를 말씀 부탁드립니다. :blush: \n (cc. <@U08L6553LEL>)',
  btn_attendance: '*[:clock10:근태 문의]* \n근태 관련 어떤 도움이 필요하신가요? :blush: \n (cc. <@U08L6553LEL>)',
  btn_vacation: '*[:palm_tree:연차 문의]* \n연차 관련 어떤 도움이 필요하신가요? :blush: \n (cc. <!subteam^S07DF7YSKB4>)',
  btn_docs: '*[:pencil:서류 발급 요청]* \n어떤 서류 발급이 필요하신가요? :blush: \n (cc. <!subteam^S07DF7YSKB4>)',
  btn_other_office: '*[기타 요청]* \n어떤 도움이 필요하신가요? :blush: \n (cc. <@U08L6553LEL>)',
};

// 4) DM 버튼별 응답 메시지
const dmButtonActions = {
  btn_repair: '*[:computer:장비 수리]* \n언제부터 어떤 증상이 있었는지 자세히 말씀해주세요. :blush:',
  btn_attendance: '*[:clock10:근태 문의]* \n근태 관련 어떤 도움이 필요하신가요? :blush:',
  btn_vacation: '*[:palm_tree:연차 문의]* \n연차 관련 어떤 도움이 필요하신가요? :blush:',
  btn_oa: '*[:toolbox:OA존 물품]* \nOA존 물품 관련 어떤 도움이 필요하신가요? :blush:',
  btn_printer: '*[:printer:복합기 연결]* \n복합기 연결 및 사용에 어려움이 있으시면 알려주세요. :blush:',
  btn_desk: '*[:busts_in_silhouette:구성원 자리 확인]* \n자리배치도 링크를 확인해주세요.\n<https://docs.google.com/spreadsheets/d/1fpPfYgudlI0uDqAn3r9wR2HYkrmZysZaz7fyPqs-bIQ/edit?gid=10814374#gid=10814374|바이트랩 자리배치도>',
};

// 5) 버튼 클릭 시 응답 처리 함수
const respond = async ({ ack, body, client }) => {
  await ack();
  const channel = body.channel.id;
  const actionId = body.actions[0].action_id;

  // DM인지 오피스 채널인지 판단
  const isDmChannel = isDM(channel);

  // 해당 채널 유형에 맞는 메시지 맵핑에서 텍스트 가져오기
  const text = isDmChannel ? dmButtonActions[actionId] : officeButtonActions[actionId];

  if (!text) {
    console.error(`No message mapped for action_id: ${actionId}`);
    return;
  }

  // DM일 때만 테스트 메시지 문구 추가
  const finalText = isDmChannel
    ? `${text}\n\n*※ 테스트 메시지입니다. 정식 요청은 <#C04NUTT5771|chat_office> 채널에서 해주세요.*`
    : text;

  try {
    if (isDmChannel) {
      await client.chat.postMessage({ channel, text: finalText });
    } else {
      // 공개채널에서는 원본 메시지의 스레드에 답글로 보냄
      const threadTs = body.message?.ts;
      if (threadTs) {
        await client.chat.postMessage({ channel, thread_ts: threadTs, text: finalText });
      } else {
        await client.chat.postMessage({ channel, text: finalText });
      }
    }
  } catch (error) {
    console.error('Error sending response message:', error);
  }
};

// 6) 버튼 액션 핸들러 등록 (오피스+DM 공통)
for (const actionId of [
  // 오피스 채널 버튼
  ...Object.keys(officeButtonActions),
  // DM 채널 버튼 (오피스에 없는 버튼 포함)
  ...Object.keys(dmButtonActions).filter((key) => !officeButtonActions[key]),
]) {
  app.action(actionId, async ({ ack, body, client }) => {
    await respond({ ack, body, client });
  });
}

// 7) 멘션 이벤트 핸들러 - 공개 채널에서는 오피스 버튼, DM에서는 DM 버튼 사용
app.event('app_mention', async ({ event, client }) => {
  try {
    const blocks = isDM(event.channel) ? getDmBlocks() : getOfficeBlocks();
    await client.chat.postMessage({
      channel: event.channel,
      thread_ts: event.ts,
      text: '무엇을 도와드릴까요?',
      blocks,
    });
  } catch (error) {
    console.error('Error handling app_mention:', error);
  }
});

// 8) DM 메시지 이벤트 핸들러 - DM이면 DM 버튼 메시지 띄우기
app.event('message', async ({ event, client }) => {
  try {
    if (event.channel_type === 'im' && !event.bot_id) {
      const blocks = getDmBlocks();
      await client.chat.postMessage({
        channel: event.channel,
        text: '무엇을 도와드릴까요? :blush:',
        blocks,
      });
    }
  } catch (error) {
    console.error('Error handling DM message event:', error);
  }
});

// 9) 헬스체크용 기본 GET 라우터
receiver.router.get('/', (req, res) => {
  res.send('Slack HelpBot is running ✅');
});

// 10) 앱 시작
(async () => {
  const port = process.env.PORT || 10000;
  await app.start(port);
  console.log('⚡ HelpBot is running on port', port);
})();
