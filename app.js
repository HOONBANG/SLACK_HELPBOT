const { App } = require("@slack/bolt");
const express = require("express");
const bodyParser = require("body-parser");
const { WebClient } = require("@slack/web-api");
require("dotenv").config();

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const slackToken = process.env.SLACK_BOT_TOKEN;
const web = new WebClient(slackToken);

// Slack Events 처리
app.post("/slack/events", async (req, res) => {
  const { event } = req.body;

  // URL Verification
  if (req.body.type === "url_verification") {
    return res.send({ challenge: req.body.challenge });
  }

  // Bot 자신의 메시지는 무시
  if (event.bot_id || event.subtype === "bot_message") {
    return res.sendStatus(200);
  }

  // 멘션 이벤트 처리
  if (event.type === "app_mention") {
    const thread_ts = event.thread_ts || event.ts;

    await web.chat.postMessage({
      channel: event.channel,
      thread_ts,
      text: "도움이 필요하신가요? 아래 항목 중 선택해주세요.",
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: "*도움이 필요하신가요? 아래 항목 중 선택해주세요.*"
          }
        },
        {
          type: "actions",
          elements: [
            { type: "button", text: { type: "plain_text", text: "IT지원" }, value: "IT지원", action_id: "support_it" },
            { type: "button", text: { type: "plain_text", text: "라이선스 요청" }, value: "라이선스 요청", action_id: "license" },
            { type: "button", text: { type: "plain_text", text: "HR문의" }, value: "HR문의", action_id: "hr" },
            { type: "button", text: { type: "plain_text", text: "서류 발급 요청" }, value: "서류 발급 요청", action_id: "docs" },
            { type: "button", text: { type: "plain_text", text: "오피스" }, value: "오피스", action_id: "office" },
            { type: "button", text: { type: "plain_text", text: "복지 안내" }, value: "복지 안내", action_id: "welfare" },
            { type: "button", text: { type: "plain_text", text: "기타 문의" }, value: "기타 문의", action_id: "etc" }
          ]
        }
      ]
    });
  }

  res.sendStatus(200);
});

// 버튼 클릭 처리
app.post("/slack/interactions", async (req, res) => {
  const payload = JSON.parse(req.body.payload);
  const { actions, channel, message, user } = payload;
  const actionId = actions[0].action_id;
  const thread_ts = message.ts;

  let blocks = [];

  if (actionId === "support_it") {
    blocks = [
      {
        type: "section",
        text: { type: "mrkdwn", text: "*어떤 IT지원이 필요하신가요?*" }
      },
      {
        type: "actions",
        elements: [
          { type: "button", text: { type: "plain_text", text: "장비 수리" }, value: "장비 수리", action_id: "repair" },
          { type: "button", text: { type: "plain_text", text: "드라이브 이동 요청" }, value: "드라이브 이동 요청", action_id: "drive" }
        ]
      }
    ];
  } else if (actionId === "license") {
    blocks = [
      {
        type: "section",
        text: { type: "mrkdwn", text: "*요청하실 라이선스를 선택해주세요.*" }
      },
      {
        type: "actions",
        elements: [
          { type: "button", text: { type: "plain_text", text: "ADOBE" }, value: "ADOBE", action_id: "adobe" },
          { type: "button", text: { type: "plain_text", text: "MS OFFICE" }, value: "MS OFFICE", action_id: "ms" },
          { type: "button", text: { type: "plain_text", text: "산돌구름" }, value: "산돌구름", action_id: "sandoll" },
          { type: "button", text: { type: "plain_text", text: "기타" }, value: "기타", action_id: "other_license" }
        ]
      }
    ];
  } else {
    // 선택된 버튼에 대해 단순 응답 메시지
    await web.chat.postMessage({
      channel: channel.id,
      thread_ts,
      text: `<@${user.id}> 님, "${actions[0].text.text}" 항목이 선택되었습니다.`
    });
    return res.sendStatus(200);
  }

  await web.chat.postMessage({
    channel: channel.id,
    thread_ts,
    text: "다음 항목을 선택해주세요.",
    blocks
  });

  res.sendStatus(200);
});

// 서버 시작
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log(`⚡ SuperBot is running on port ${PORT}`);
});
