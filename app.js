const express = require("express");
const bodyParser = require("body-parser");
const { WebClient } = require("@slack/web-api");
const { createEventAdapter } = require("@slack/events-api");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 10000;

const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;
const slackToken = process.env.SLACK_BOT_TOKEN;

const slackEvents = createEventAdapter(slackSigningSecret);
const web = new WebClient(slackToken);

// 미들웨어
app.use("/slack/events", slackEvents.expressMiddleware());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: true }));

// ✅ 멘션 이벤트 처리
slackEvents.on("app_mention", async (event) => {
  try {
    await web.chat.postMessage({
      channel: event.channel,
      thread_ts: event.ts, // 스레드에 메시지 전송
      text: "무엇을 도와드릴까요?",
      blocks: [
        {
          type: "section",
          text: { type: "mrkdwn", text: "무엇을 도와드릴까요?" },
        },
        {
          type: "actions",
          elements: [
            {
              type: "button",
              text: { type: "plain_text", text: "IT지원" },
              value: "support_it",
              action_id: "support_it",
            },
            {
              type: "button",
              text: { type: "plain_text", text: "라이선스 요청" },
              value: "license_request",
              action_id: "license_request",
            },
            {
              type: "button",
              text: { type: "plain_text", text: "HR문의" },
              value: "hr",
              action_id: "hr",
            },
            {
              type: "button",
              text: { type: "plain_text", text: "서류 발급 요청" },
              value: "document_request",
              action_id: "document_request",
            },
            {
              type: "button",
              text: { type: "plain_text", text: "오피스" },
              value: "office",
              action_id: "office",
            },
            {
              type: "button",
              text: { type: "plain_text", text: "복지 안내" },
              value: "welfare",
              action_id: "welfare",
            },
            {
              type: "button",
              text: { type: "plain_text", text: "기타 문의" },
              value: "etc",
              action_id: "etc",
            },
          ],
        },
      ],
    });
  } catch (error) {
    console.error("멘션 처리 오류:", error);
  }
});

// ✅ 버튼 클릭 처리
app.post("/slack/interactions", async (req, res) => {
  const payload = JSON.parse(req.body.payload);
  const action = payload.actions[0];
  const channel = payload.channel.id;
  const thread_ts = payload.message.ts;

  try {
    if (action.action_id === "support_it") {
      await web.chat.postMessage({
        channel: channel,
        thread_ts: thread_ts,
        text: "IT지원 요청을 선택하셨습니다.",
        blocks: [
          {
            type: "section",
            text: { type: "mrkdwn", text: "*어떤 IT지원을 원하시나요?*" },
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: { type: "plain_text", text: "장비 수리" },
                value: "device_repair",
                action_id: "device_repair",
              },
              {
                type: "button",
                text: { type: "plain_text", text: "드라이브 이동 요청" },
                value: "drive_move",
                action_id: "drive_move",
              },
            ],
          },
        ],
      });
    }

    if (action.action_id === "license_request") {
      await web.chat.postMessage({
        channel: channel,
        thread_ts: thread_ts,
        text: "라이선스 요청을 선택하셨습니다.",
        blocks: [
          {
            type: "section",
            text: { type: "mrkdwn", text: "*요청할 라이선스를 선택해주세요.*" },
          },
          {
            type: "actions",
            elements: [
              {
                type: "button",
                text: { type: "plain_text", text: "ADOBE" },
                value: "adobe",
                action_id: "adobe",
              },
              {
                type: "button",
                text: { type: "plain_text", text: "MS OFFICE" },
                value: "ms_office",
                action_id: "ms_office",
              },
              {
                type: "button",
                text: { type: "plain_text", text: "산돌구름" },
                value: "sandoll",
                action_id: "sandoll",
              },
              {
                type: "button",
                text: { type: "plain_text", text: "기타" },
                value: "other_license",
                action_id: "other_license",
              },
            ],
          },
        ],
      });
    }

    // 다른 action_id에 대한 처리도 여기에 추가 가능

    res.status(200).send(); // 응답 안 보내면 Slack이 계속 재시도함
  } catch (error) {
    console.error("버튼 처리 오류:", error);
    res.status(500).send();
  }
});

// 서버 시작
app.listen(port, () => {
  console.log(`⚡ SuperBot is running on port ${port}`);
});
