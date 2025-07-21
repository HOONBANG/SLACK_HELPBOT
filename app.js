const { App, ExpressReceiver } = require('@slack/bolt');
const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();

// Custom ExpressReceiver to access the express app
const receiver = new ExpressReceiver({
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

// Add middleware for parsing
receiver.router.use(bodyParser.urlencoded({ extended: true }));
receiver.router.use(bodyParser.json());

// Initialize Bolt App with custom receiver
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver
});

// 1단계 버튼 응답
app.event('app_mention', async ({ event, client }) => {
  try {
    await client.chat.postMessage({
      channel: event.channel,
      thread_ts: event.ts,
      text: "도움이 필요하신가요?",
      blocks: [
        {
          type: "section",
          text: { type: "plain_text", text: "도움이 필요하신가요?" }
        },
        {
          type: "actions",
          elements: [
            { type: "button", text: { type: "plain_text", text: "IT지원" }, value: "it_support", action_id: "first_level" },
            { type: "button", text: { type: "plain_text", text: "라이선스 요청" }, value: "license", action_id: "first_level" },
            { type: "button", text: { type: "plain_text", text: "HR문의" }, value: "hr", action_id: "first_level" },
            { type: "button", text: { type: "plain_text", text: "서류 발급 요청" }, value: "documents", action_id: "first_level" },
            { type: "button", text: { type: "plain_text", text: "오피스" }, value: "office", action_id: "first_level" },
            { type: "button", text: { type: "plain_text", text: "복지 안내" }, value: "welfare", action_id: "first_level" },
            { type: "button", text: { type: "plain_text", text: "기타 문의" }, value: "etc", action_id: "first_level" }
          ]
        }
      ]
    });
  } catch (error) {
    console.error('Error handling app_mention:', error);
  }
});

// 버튼 클릭 응답
receiver.router.post('/slack/interactions', async (req, res) => {
  const payload = JSON.parse(req.body.payload);
  const action = payload.actions[0];
  const value = action.value;
  const channelId = payload.channel.id;
  const threadTs = payload.message.ts;

  try {
    if (value === 'it_support') {
      await app.client.chat.postMessage({
        channel: channelId,
        thread_ts: threadTs,
        text: "필요한 IT 지원을 선택해주세요.",
        blocks: [
          {
            type: "actions",
            elements: [
              { type: "button", text: { type: "plain_text", text: "장비 수리" }, value: "repair" },
              { type: "button", text: { type: "plain_text", text: "드라이브 이동 요청" }, value: "drive_move" }
            ]
          }
        ]
      });
    } else if (value === 'license') {
      await app.client.chat.postMessage({
        channel: channelId,
        thread_ts: threadTs,
        text: "요청할 라이선스를 선택해주세요.",
        blocks: [
          {
            type: "actions",
            elements: [
              { type: "button", text: { type: "plain_text", text: "ADOBE" }, value: "adobe" },
              { type: "button", text: { type: "plain_text", text: "MS OFFICE" }, value: "ms_office" },
              { type: "button", text: { type: "plain_text", text: "산돌구름" }, value: "sandoll" },
              { type: "button", text: { type: "plain_text", text: "기타" }, value: "other_license" }
            ]
          }
        ]
      });
    } else {
      await app.client.chat.postMessage({
        channel: channelId,
        thread_ts: threadTs,
        text: "해당 기능은 아직 구현되지 않았어요."
      });
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('Error handling interaction:', error);
    res.sendStatus(500);
  }
});

// 기본 라우터 (슬랙 외 요청 방지)
receiver.router.get('/', (req, res) => {
  res.send('Slack SuperBot is running!');
});

// 서버 시작
(async () => {
  const port = process.env.PORT || 10000;
  await app.start(port);
  console.log(`⚡ SuperBot is running on port ${port}`);
})();
