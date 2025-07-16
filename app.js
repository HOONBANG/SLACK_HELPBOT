```js

const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();

// Slack App 토큰 (SLACK_BOT_TOKEN을 Render 환경변수로 넣으세요!)
const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// 슬래시 커맨드 예: /superbot
app.post('/slack/commands', async (req, res) => {
  const { user_id } = req.body;

  const blocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '무엇을 도와드릴까요? 😊'
      }
    },
    {
      type: 'actions',
      elements: [
        {
          type: 'button',
          text: {
            type: 'plain_text',
            text: '오늘 날씨'
          },
          action_id: 'weather_button',
          value: user_id  // 사용자의 ID를 전달
        }
      ]
    }
  ];

  return res.json({
    response_type: 'ephemeral',
    blocks
  });
});

// 버튼 클릭 처리
app.post('/slack/interactions', async (req, res) => {
  const payload = JSON.parse(req.body.payload);
  const action = payload.actions[0];

  if (action.action_id === 'weather_button') {
    const userId = action.value;

    // DM 채널 열기
    const imResponse = await axios.post(
      'https://slack.com/api/conversations.open',
      { users: userId },
      {
        headers: {
          Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const channelId = imResponse.data.channel.id;

    // DM 메시지 보내기
    await axios.post(
      'https://slack.com/api/chat.postMessage',
      {
        channel: channelId,
        text: '오늘 날씨는 맑음입니다. ☀️'
      },
      {
        headers: {
          Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    return res.send('');
  }

  return res.sendStatus(200);
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`SuperBot server listening on port ${PORT}`);
});
