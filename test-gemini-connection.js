// 测试Gemini API连接和密钥权限
const https = require('https');
const fs = require('fs');

// 直接从.env.local文件读取API密钥
let API_KEY = '';
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const match = envContent.match(/GEMINI_API_KEY=\"([^\"]+)\"/);
  if (match && match[1]) {
    API_KEY = match[1];
  }
} catch (e) {
  console.error('读取.env.local文件失败:', e.message);
}

console.log('测试网络连接到Gemini API...');
console.log('API密钥长度:', API_KEY ? API_KEY.length : 0);
console.log('API密钥是否存在:', !!API_KEY);

// 直接使用https模块测试连接
const options = {
  hostname: 'generativelanguage.googleapis.com',
  port: 443,
  path: `/v1beta/models/gemini-1.5-flash?key=${API_KEY}`,
  method: 'GET'
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('状态码:', res.statusCode);
    console.log('响应头:', res.headers);
    try {
      const json = JSON.parse(data);
      console.log('解析后的响应:', JSON.stringify(json, null, 2));
      console.log('\n连接测试成功! API密钥可能有效。');
    } catch (e) {
      console.log('响应体:', data);
      console.log('无法解析为JSON');
    }
  });
});

req.on('error', (e) => {
  console.error('连接错误:', e.message);
  console.log('\n可能的原因:');
  console.log('1. 网络连接问题');
  console.log('2. API密钥无效或权限不足');
  console.log('3. 防火墙或代理限制');
});

req.end();