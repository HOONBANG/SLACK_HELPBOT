const express = require("express");
const bodyParser = require("body-parser");
const { WebClient } = require("@slack/web-api");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const port = process.env.PORT || 10000;

const slackToken = process.env.SLACK_BOT_TOKEN;
const web = new WebClient(slackToken);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// ✅ 멘션 메시지 수신
app.post("/slack/events", async (req, res) => {
  const { event } = req.body;

  if (event && event.type === "app_mention") {
    const thread_ts = event.ts; // 스레드로 응답

    await web.chat.postMessage({
      channel: event.channel,
      thread_ts,
      text: "*도움이 필요하신가요? 아래 항목 중 선택해주세요.*",
      blocks: [
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

    return res.status(200).send();
  }

  res.status(200).send();
});

// ✅ 버튼 클릭 처리
app.post("/interact", async (req, res) => {
  const payload = JSON.parse(req.body.payload);
  const { user, channel, message, actions } = payload;

  const actionId = actions[0].action_id;
  const thread_ts = message.ts;

  let text = "";
  let blocks = [];

  if (actionId === "support_it") {
    text = "*IT 지원 항목을 선택해주세요*";
    blocks = [
      {
        type: "actions",
        elements: [
          { type: "button", text: { type: "plain_text", text: "장비 수리" }, value: "장비 수리", action_id: "repair" },
          { type: "button", text: { type: "plain_text", text: "드라이브 이동 요청" }, value: "드라이브 이동 요청", action_id: "drive" }
        ]
      }
    ];
  } else if (actionId === "license") {
    text = "*라이선스 요청 항목을 선택해주세요*";
    blocks = [
      {
        type: "actions",
        elements: [
          { type: "button", text: { type: "plain_text", text: "ADOBE" }, value: "ADOBE", action_id: "adobe" },
          { type: "button", text: { type: "plain_text", text: "MS OFFICE" }, value: "MS OFFICE", action_id: "office_license" },
          { type: "button", text: { type: "plain_text", text: "산돌구름" }, value: "산돌구름", action_id: "sandoll" },
          { type: "button", text: { type: "plain_text", text: "기타" }, value: "기타", action_id: "etc_license" }
        ]
      }
    ];
  } else {
    text = `*${actions[0].value}* 항목을 선택하셨습니다. 담당자가 곧 도와드릴게요.`;
  }

  await web.chat.postMessage({
    channel: channel.id,
    thread_ts,
    text,
    blocks
  });

  res.status(200).send();
});

app.listen(port, () => {
  console.log(`⚡ SuperBot is running on port ${port}`);
});
