// 测试修复效果的脚本
const http = require('http');

// 测试 chat API
testChatAPI();

// 测试 summary API
setTimeout(testSummaryAPI, 1000);

function testChatAPI() {
  console.log('\n=== 测试 Chat API ===');
  
  const postData = JSON.stringify({
    text: '今天天气很好',
    history: [],
    image: null
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/chat',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Chat API 状态码: ${res.statusCode}`);
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('Chat API 响应:', response);
        
        if (response.isMock) {
          console.log('✅ 成功使用模拟响应');
        } else if (response.isRealAPI) {
          console.log('✅ 成功使用真实API');
        } else if (response.error) {
          console.log('❌ 仍然出现错误:', response.error);
        }
      } catch (e) {
        console.log('❌ 无法解析响应:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`❌ 连接错误: ${e.message}`);
  });

  req.write(postData);
  req.end();
}

function testSummaryAPI() {
  console.log('\n=== 测试 Summary API ===');
  
  const postData = JSON.stringify({
    messages: [
      { role: 'user', text: '今天完成了一个重要任务' },
      { role: 'model', text: '恭喜你！又完成了一件事 ✅' }
    ]
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/summary',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Summary API 状态码: ${res.statusCode}`);
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('Summary API 响应:', response);
        
        if (response.isMock) {
          console.log('✅ 成功使用模拟响应');
        } else if (response.isRealAPI) {
          console.log('✅ 成功使用真实API');
        } else if (response.error) {
          console.log('❌ 仍然出现错误:', response.error);
        }
      } catch (e) {
        console.log('❌ 无法解析响应:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error(`❌ 连接错误: ${e.message}`);
  });

  req.write(postData);
  req.end();
}