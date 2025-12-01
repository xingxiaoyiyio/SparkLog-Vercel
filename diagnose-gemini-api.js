// 详细诊断Google Gemini API错误的脚本
const https = require('https');
const fs = require('fs');

// 尝试从.env.local文件读取API密钥
function getApiKey() {
  try {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const match = envContent.match(/GEMINI_API_KEY=(.+)/);
    return match ? match[1].trim().replace(/^"|"$/g, '') : null;
  } catch (error) {
    console.error('读取.env.local文件失败:', error.message);
    return null;
  }
}

// 测试模型列表端点 - 这个端点能测试API密钥的基本有效性
function testModelList(apiKey) {
  console.log('\n=== 测试模型列表端点 (测试API密钥有效性) ===');
  console.log(`使用API密钥长度: ${apiKey.length}`);
  
  const options = {
    hostname: 'generativelanguage.googleapis.com',
    path: '/v1beta/models',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    }
  };

  const req = https.request(options, (res) => {
    console.log(`状态码: ${res.statusCode}`);
    console.log('响应头:', JSON.stringify(res.headers, null, 2));
    
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        console.log('响应体:', JSON.stringify(response, null, 2));
        
        // 分析错误类型
        if (res.statusCode === 401) {
          console.log('\n❌ 诊断结果: API密钥无效或已过期');
        } else if (res.statusCode === 403) {
          console.log('\n❌ 诊断结果: API密钥缺少必要权限');
        } else if (res.statusCode === 429) {
          console.log('\n❌ 诊断结果: API调用频率超限');
        } else if (res.statusCode === 200) {
          console.log('\n✅ 诊断结果: API密钥有效，具有基本访问权限');
        } else {
          console.log(`\n❓ 诊断结果: 未知错误，状态码 ${res.statusCode}`);
        }
      } catch (e) {
        console.error('解析响应失败:', e);
        console.log('原始响应:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.error('\n❌ 连接错误:', e.message);
    console.log('可能原因:');
    console.log('1. 网络连接问题或防火墙阻止');
    console.log('2. DNS解析失败');
    console.log('3. 代理设置问题');
  });

  req.end();
}

// 测试生成内容端点 - 更接近实际使用场景
function testGenerateContent(apiKey) {
  setTimeout(() => {
    console.log('\n=== 测试生成内容端点 (测试实际使用场景) ===');
    
    const postData = JSON.stringify({
      contents: [{
        role: 'user',
        parts: [{ text: '测试消息' }]
      }]
    });

    const options = {
      hostname: 'generativelanguage.googleapis.com',
      path: '/v1beta/models/gemini-1.5-flash:generateContent',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'x-goog-api-key': apiKey
      }
    };

    const req = https.request(options, (res) => {
      console.log(`状态码: ${res.statusCode}`);
      
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          console.log('响应体:', JSON.stringify(response, null, 2));
          
          // 分析具体错误
          if (res.statusCode === 401) {
            console.log('\n❌ 诊断结果: API密钥无效或已过期');
          } else if (res.statusCode === 403) {
            console.log('\n❌ 诊断结果: API密钥缺少gemini-1.5-flash模型的使用权限');
          } else if (res.statusCode === 400 && response.error?.details) {
            console.log('\n❌ 诊断结果: 请求格式错误或参数问题');
            console.log('详细错误:', response.error.details);
          } else if (res.statusCode === 200) {
            console.log('\n✅ 诊断结果: 成功调用生成内容API');
          } else {
            console.log(`\n❓ 诊断结果: 未知错误，状态码 ${res.statusCode}`);
          }
        } catch (e) {
          console.error('解析响应失败:', e);
          console.log('原始响应:', data);
        }
      });
    });

    req.on('error', (e) => {
      console.error('\n❌ 连接错误:', e.message);
      console.log('可能原因:');
      console.log('1. 网络连接问题或防火墙阻止');
      console.log('2. API端点不可访问');
    });

    req.write(postData);
    req.end();
  }, 1000);
}

// 开始诊断
const apiKey = getApiKey();

if (!apiKey) {
  console.error('❌ 无法获取API密钥');
  process.exit(1);
}

console.log('开始诊断Google Gemini API错误...');
testModelList(apiKey);
testGenerateContent(apiKey);