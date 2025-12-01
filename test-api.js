const http = require('http');

// 测试 chat API
testChatApi();

function testChatApi() {
  console.log('测试 chat API...');
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/chat',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(JSON.stringify({
        text: '你好',
        history: []
      }))
    }
  };

  const req = http.request(options, (res) => {
    console.log('状态码:', res.statusCode);
    console.log('响应头:', res.headers);
    
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('响应体:', data);
      try {
        const jsonData = JSON.parse(data);
        console.log('解析后的 JSON:', jsonData);
      } catch (e) {
        console.log('无法解析为 JSON');
      }
    });
  });

  req.on('error', (e) => {
    console.error('请求错误:', e.message);
  });

  req.write(JSON.stringify({
    text: '你好',
    history: []
  }));
  req.end();
}
